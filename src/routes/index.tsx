import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckIcon, LinkIcon, ShuffleIcon } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { DetailModal } from "#/components/DetailModal";
import { ErrorBoundary } from "#/components/ErrorBoundary";
import { NameDetail } from "#/components/NameDetail";
import { SpeciesCard } from "#/components/SpeciesCard";
import { SpeciesImage } from "#/components/SpeciesImage";
import { SpeciesProfile } from "#/components/SpeciesProfile";
import { Button } from "#/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { getItem, useSearch } from "#/hooks/useSearch";
import { useWikidataSpecies } from "#/hooks/useWikidataSpecies";
import { trackCopyLink, trackDetailView, trackSearch } from "#/lib/analytics";
import { useDatabase } from "#/lib/DatabaseContext";

interface SearchParams {
	q?: string;
	name?: string; // Selected name ID for modal
	species?: string; // Selected species ID for profile
}

// Session storage keys (persists across HMR/deep links)
const STORAGE_KEYS = {
	previousName: "linkedfin_prev_name",
	previousSpecies: "linkedfin_prev_species",
	shuffleKey: "linkedfin_shuffle_key",
} as const;

function getStoredValue(key: keyof typeof STORAGE_KEYS): string | null {
	try {
		return sessionStorage.getItem(STORAGE_KEYS[key]);
	} catch {
		return null;
	}
}

function setStoredValue(key: keyof typeof STORAGE_KEYS, value: string) {
	try {
		sessionStorage.setItem(STORAGE_KEYS[key], value);
	} catch {
		// Ignore storage errors
	}
}

function getInitialShuffleKey(): number {
	const stored = getStoredValue("shuffleKey");
	return stored ? Number.parseInt(stored, 10) || 0 : 0;
}

const RANDOM_SAMPLE_SIZE = 10;

/**
 * Fisher-Yates shuffle to get random sample.
 * Returns a new array with `count` random elements.
 */
function getRandomSample<T>(array: T[], count: number): T[] {
	if (array.length <= count) return array;
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled.slice(0, count);
}

export const Route = createFileRoute("/")({
	validateSearch: (search: Record<string, unknown>): SearchParams => ({
		q: typeof search.q === "string" ? search.q : undefined,
		name: typeof search.name === "string" ? search.name : undefined,
		species: typeof search.species === "string" ? search.species : undefined,
	}),
	component: HomePage,
});

function CopyLinkButton({ nameId }: { nameId: string }) {
	const [copied, setCopied] = useState(false);

	const copyLink = async () => {
		const url = new URL(window.location.origin + window.location.pathname);
		url.searchParams.set("name", nameId);
		await navigator.clipboard.writeText(url.toString());
		trackCopyLink(nameId);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={copyLink}
			title="Copy link"
			className="shrink-0"
		>
			{copied ? (
				<CheckIcon className="h-4 w-4 text-green-500" />
			) : (
				<LinkIcon className="h-4 w-4" />
			)}
		</Button>
	);
}

function WelcomeHero({
	name,
	scientificName,
	onClick,
	onShuffle,
}: {
	name: string;
	scientificName: string;
	onClick: () => void;
	onShuffle: () => void;
}) {
	const { data, isLoading } = useWikidataSpecies(scientificName);

	return (
		<div className="flex flex-col items-center gap-4 py-6 text-center">
			{/* Welcome text */}
			<div className="space-y-0.5">
				<h2 className="text-lg font-semibold">Welcome to LinkedFin</h2>
				<p className="text-sm text-muted-foreground">
					Fish name etymology database
				</p>
			</div>

			{/* Image + name/species as a connected unit */}
			<div className="relative">
				<button
					type="button"
					onClick={onClick}
					className="group flex cursor-pointer flex-col items-center gap-1.5 rounded-xl p-3 transition hover:bg-muted/50"
				>
					<div className="h-28 w-28 ring-2 ring-border transition group-hover:ring-primary rounded-full">
						{isLoading ? (
							<div className="h-full w-full animate-pulse rounded-full bg-muted-foreground/20" />
						) : (
							<SpeciesImage
								imageUrl={data?.imageUrl}
								alt={scientificName}
								circular={true}
								className="h-full w-full"
							/>
						)}
					</div>
					<div className="text-xs">
						<span className="font-medium">{name}</span>
						<span className="text-muted-foreground"> · </span>
						<span className="italic text-muted-foreground">
							{scientificName}
						</span>
					</div>
				</button>

				{/* Shuffle button */}
				<button
					type="button"
					onClick={onShuffle}
					className="absolute -right-1 top-2 cursor-pointer rounded-full bg-background p-1.5 text-muted-foreground ring-1 ring-border transition hover:bg-muted hover:text-foreground"
					title="Shuffle"
				>
					<ShuffleIcon className="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	);
}

function HomePage() {
	const { q = "", name: nameId, species: speciesId } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const { names, getNameById, getSpeciesInfo } = useDatabase();

	// Defer the search query so expensive Fuse.js search doesn't block UI
	const deferredQuery = useDeferredValue(q);
	const searchResults = useSearch(deferredQuery);

	// Shuffle key to force re-randomization (persisted across HMR)
	const [shuffleKey, setShuffleKey] = useState(getInitialShuffleKey);

	const shuffle = () => {
		setShuffleKey((k) => {
			const next = k + 1;
			setStoredValue("shuffleKey", String(next));
			return next;
		});
	};

	// Random sample for empty query (stable until shuffle or page refresh)
	// biome-ignore lint/correctness/useExhaustiveDependencies: shuffleKey triggers reshuffle intentionally
	const randomSample = useMemo(
		() => getRandomSample(names, RANDOM_SAMPLE_SIZE),
		[names, shuffleKey],
	);

	// Use search results if query is 2+ chars, otherwise show random sample
	const isValidSearch = deferredQuery.trim().length >= 2;
	const results = isValidSearch ? searchResults : randomSample;

	// Track searches (debounced 1s to avoid spam)
	const searchTrackingTimeout = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	useEffect(() => {
		if (searchTrackingTimeout.current) {
			clearTimeout(searchTrackingTimeout.current);
		}
		if (deferredQuery.trim().length >= 2) {
			searchTrackingTimeout.current = setTimeout(() => {
				trackSearch(deferredQuery, searchResults.length);
			}, 1000);
		}
		return () => {
			if (searchTrackingTimeout.current) {
				clearTimeout(searchTrackingTimeout.current);
			}
		};
	}, [deferredQuery, searchResults.length]);

	const selectedName = nameId ? getNameById(nameId) : null;
	const selectedSpecies = speciesId ? getSpeciesInfo(speciesId) : null;

	// Track navigation history for back buttons (persisted in sessionStorage)
	useEffect(() => {
		if (nameId) {
			setStoredValue("previousName", nameId);
		}
	}, [nameId]);

	useEffect(() => {
		if (speciesId) {
			setStoredValue("previousSpecies", speciesId);
		}
	}, [speciesId]);

	const openDetail = (id: string) => {
		const name = getNameById(id);
		if (name) {
			trackDetailView(id, name.name);
		}
		navigate({
			search: (prev) => ({ q: prev.q, name: id }),
		});
	};

	const openSpecies = (id: string) => {
		navigate({
			search: (prev) => ({ q: prev.q, species: id }),
		});
	};

	const closeDetail = () => {
		navigate({
			search: (prev) => ({ q: prev.q }), // Remove name/species, keep q
		});
	};

	const backToSpecies = () => {
		const previousId = getStoredValue("previousSpecies");
		if (previousId) {
			navigate({
				search: (prev) => ({ q: prev.q, species: previousId }),
			});
		} else {
			closeDetail();
		}
	};

	const backToName = () => {
		const previousId = getStoredValue("previousName");
		if (previousId) {
			navigate({
				search: (prev) => ({ q: prev.q, name: previousId }),
			});
		} else {
			closeDetail();
		}
	};

	const displayResults = results.map(getItem);
	const featuredItem = displayResults[0];

	return (
		<main className="page-wrap flex flex-col px-4 pb-8">
			{/* Welcome hero when in random mode */}
			{!isValidSearch && featuredItem && (
				<WelcomeHero
					name={featuredItem.name}
					scientificName={featuredItem.scientific_name}
					onClick={() => openDetail(featuredItem.id)}
					onShuffle={shuffle}
				/>
			)}

			<div className="my-3 flex items-center gap-2 text-xs text-muted-foreground">
				<span>
					{isValidSearch
						? `${displayResults.length} results`
						: `${RANDOM_SAMPLE_SIZE} random from ${names.length} names`}
				</span>
				{!isValidSearch && (
					<button
						type="button"
						onClick={shuffle}
						className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-muted hover:text-foreground"
						title="Shuffle"
					>
						<ShuffleIcon className="h-3 w-3" />
						<span>Shuffle</span>
					</button>
				)}
			</div>

			<div className="-mx-4 overflow-x-auto px-4">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Transliteration</TableHead>
							<TableHead>Region</TableHead>
							<TableHead>Species</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{displayResults.map((item) => (
							<TableRow
								key={item.id}
								className="cursor-pointer"
								onClick={() => openDetail(item.id)}
							>
								<TableCell className="font-medium">{item.name}</TableCell>
								<TableCell>{item.transliteration || ""}</TableCell>
								<TableCell>{item.region}</TableCell>
								<TableCell className="italic">{item.scientific_name}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Name Detail Modal */}
			<DetailModal
				open={!!selectedName && !speciesId}
				onOpenChange={(open) => !open && closeDetail()}
				onBack={getStoredValue("previousSpecies") ? backToSpecies : undefined}
				title={selectedName?.name || ""}
				action={selectedName && <CopyLinkButton nameId={selectedName.id} />}
			>
				{selectedName && (
					<div className="space-y-4">
						<SpeciesCard
							scientificName={selectedName.scientific_name}
							onClick={() => openSpecies(selectedName.species_id)}
						/>
						<NameDetail name={selectedName} onNavigate={openDetail} />
					</div>
				)}
			</DetailModal>

			{/* Species Profile Modal */}
			<DetailModal
				open={!!selectedSpecies}
				onOpenChange={(open) => !open && closeDetail()}
				onBack={getStoredValue("previousName") ? backToName : undefined}
				title={
					<span className="italic">
						{selectedSpecies?.scientific_name || ""}
					</span>
				}
			>
				{selectedSpecies && speciesId && (
					<ErrorBoundary
						fallback={
							<div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
								<p className="text-sm text-muted-foreground">
									Failed to load species profile.
								</p>
							</div>
						}
					>
						<SpeciesProfile
							speciesId={speciesId}
							scientificName={selectedSpecies.scientific_name}
							speciesNotes={selectedSpecies.notes}
							onNameClick={openDetail}
						/>
					</ErrorBoundary>
				)}
			</DetailModal>
		</main>
	);
}
