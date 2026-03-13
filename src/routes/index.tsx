import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShuffleIcon, XIcon } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { SpeciesImage } from "#/components/SpeciesImage";
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
import { trackDetailView, trackSearch } from "#/lib/analytics";
import { useDatabase } from "#/lib/DatabaseContext";

interface SearchParams {
	q?: string;
}

// Session storage keys (persists across HMR/deep links)
const STORAGE_KEYS = {
	shuffleKey: "linkedfin_shuffle_key",
	heroShuffleKey: "linkedfin_hero_shuffle_key",
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
	}),
	component: HomePage,
});

function WelcomeHero({
	nameId,
	name,
	scientificName,
	onShuffle,
}: {
	nameId: string;
	name: string;
	scientificName: string;
	onShuffle: () => void;
}) {
	const { data, isLoading } = useWikidataSpecies(scientificName);

	return (
		<div className="flex flex-col items-center gap-4 py-6 text-center">
			{/* Welcome text */}
			<div className="space-y-1">
				<h2 className="text-lg font-semibold">
					<span className="font-normal text-muted-foreground">Welcome to</span>{" "}
					<span className="text-foreground">Linked</span>
					<span className="rounded bg-[#0891B2] px-1 text-white">Fin</span>
				</h2>
				<p className="text-sm text-muted-foreground">
					Fish name etymology database
				</p>
			</div>

			{/* Image + name/species as a connected unit */}
			<div className="relative">
				<Link
					to="/name/$id"
					params={{ id: nameId }}
					className="group flex flex-col items-center gap-1.5 rounded-xl p-3"
				>
					<div className="relative w-36 aspect-[4/3]">
						<div className="h-full w-full overflow-hidden rounded-xl ring-2 ring-border transition group-hover:ring-primary">
							{isLoading ? (
								<div className="h-full w-full animate-pulse bg-muted-foreground/20" />
							) : (
								<SpeciesImage
									imageUrl={data?.imageUrl}
									alt={scientificName}
									large
									className="h-full w-full"
								/>
							)}
						</div>
					</div>
					<div className="text-xs">
						<span className="font-medium">{name}</span>
						<span className="text-muted-foreground"> · </span>
						<span className="italic text-muted-foreground">
							{scientificName}
						</span>
					</div>
				</Link>
				{/* Shuffle button */}
				<button
					type="button"
					onClick={onShuffle}
					className="absolute bottom-[38px] right-[18px] z-10 cursor-pointer rounded-full bg-background/80 p-1.5 text-muted-foreground ring-1 ring-border transition hover:bg-background hover:text-foreground"
					title="Shuffle"
				>
					<ShuffleIcon className="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	);
}

function HomePage() {
	const { q = "" } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const { names } = useDatabase();

	// Defer the search query so expensive Fuse.js search doesn't block UI
	const deferredQuery = useDeferredValue(q);
	const searchResults = useSearch(deferredQuery);

	// Shuffle keys to force re-randomization (persisted across HMR)
	const [shuffleKey, setShuffleKey] = useState(getInitialShuffleKey);
	const [heroShuffleKey, setHeroShuffleKey] = useState(() => {
		const stored = getStoredValue("heroShuffleKey");
		return stored ? Number.parseInt(stored, 10) || 0 : 0;
	});

	const shuffleTable = () => {
		setShuffleKey((k) => {
			const next = k + 1;
			setStoredValue("shuffleKey", String(next));
			return next;
		});
	};

	const shuffleHero = () => {
		setHeroShuffleKey((k) => {
			const next = k + 1;
			setStoredValue("heroShuffleKey", String(next));
			return next;
		});
	};

	// Random sample for table (stable until shuffle or page refresh)
	// biome-ignore lint/correctness/useExhaustiveDependencies: shuffleKey triggers reshuffle intentionally
	const randomSample = useMemo(
		() => getRandomSample(names, RANDOM_SAMPLE_SIZE),
		[names, shuffleKey],
	);

	// Independent hero item (separate from table)
	// Use state + effect to avoid SSR hydration mismatch from Math.random()
	const [heroItem, setHeroItem] = useState<ReturnType<typeof getItem> | null>(
		null,
	);
	// biome-ignore lint/correctness/useExhaustiveDependencies: heroShuffleKey triggers reshuffle intentionally
	useEffect(() => {
		if (names.length > 0) {
			setHeroItem(getItem(names[Math.floor(Math.random() * names.length)]));
		}
	}, [names, heroShuffleKey]);

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

	const displayResults = results.map(getItem);

	return (
		<main className="page-wrap flex flex-col px-4 pb-8">
			{/* Welcome hero when in random mode */}
			{!isValidSearch && heroItem && (
				<WelcomeHero
					nameId={heroItem.id}
					name={heroItem.name}
					scientificName={heroItem.scientific_name}
					onShuffle={shuffleHero}
				/>
			)}

			<div className="my-3 flex items-center gap-2 text-xs text-muted-foreground">
				<span>
					{isValidSearch
						? `${displayResults.length} results`
						: `${RANDOM_SAMPLE_SIZE} random from ${names.length} names`}
				</span>
				{isValidSearch && (
					<button
						type="button"
						onClick={() => navigate({ search: { q: undefined } })}
						className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-muted hover:text-foreground"
						title="Clear search"
					>
						<XIcon className="h-3 w-3" />
						<span>Clear</span>
					</button>
				)}
				{!isValidSearch && (
					<button
						type="button"
						onClick={shuffleTable}
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
							<TableHead className="text-right">Species</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{displayResults.map((item) => (
							<TableRow
								key={item.id}
								className="cursor-pointer"
								onClick={() => {
									trackDetailView(item.id, item.name);
									navigate({
										to: "/name/$id",
										params: { id: item.id },
									});
								}}
							>
								<TableCell className="font-medium">{item.name}</TableCell>
								<TableCell>{item.transliteration || ""}</TableCell>
								<TableCell>{item.region}</TableCell>
								<TableCell className="text-right italic">
									{item.scientific_name}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</main>
	);
}
