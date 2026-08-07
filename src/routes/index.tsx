import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShuffleIcon } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
	DEFAULT_SORT_VALUE,
	NamesTable,
	SORT_VALUES,
} from "#/components/NamesTable";
import { SpeciesImage } from "#/components/SpeciesImage";
import { getItem, useSearch } from "#/hooks/useSearch";
import { useWikidataSpecies } from "#/hooks/useWikidataSpecies";
import { trackDetailView, trackSearch } from "#/lib/analytics";
import { useDatabase } from "#/lib/DatabaseContext";
import { nextSeed } from "#/lib/randomOrder";
import { canonical } from "#/lib/site";

interface SearchParams {
	q?: string;
	/** 1-based table page. Omitted (not `1`) so the default URL stays clean. */
	page?: number;
	sort?: string;
	dir?: "desc";
}

function parsePage(value: unknown): number | undefined {
	const page =
		typeof value === "number" ? value : Number.parseInt(String(value), 10);
	return Number.isFinite(page) && page > 1 ? page : undefined;
}

// Session storage keys (persists across HMR/deep links)
const STORAGE_KEYS = {
	shuffleSeed: "linkedfin_shuffle_seed",
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

/**
 * Initial random-order seed. Deterministic on the server (0) so SSR markup
 * matches hydration; a real seed is drawn in an effect after mount.
 */
function getInitialShuffleSeed(): number {
	const stored = getStoredValue("shuffleSeed");
	return stored ? Number.parseInt(stored, 10) || 0 : 0;
}

export const Route = createFileRoute("/")({
	validateSearch: (search: Record<string, unknown>): SearchParams => ({
		q: typeof search.q === "string" ? search.q : undefined,
		page: parsePage(search.page),
		sort: SORT_VALUES.includes(String(search.sort))
			? String(search.sort)
			: undefined,
		dir: search.dir === "desc" ? "desc" : undefined,
	}),
	/**
	 * No loader. This route is the fuzzy search over all 512 names, which needs
	 * the whole table in memory — dehydrating it into the document would add
	 * ~250 KB to the most-visited page to make ten table rows crawlable, and the
	 * rows are not links, so it would buy no crawl paths either. The detail
	 * pages carry the indexable text and sitemap.xml carries the discovery.
	 */
	head: () => ({
		links: [{ rel: "canonical", href: canonical("/") }],
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
								file={data?.imageFile}
								alt={scientificName}
								/* The slot is 144 CSS px wide (w-36); asking for 600 used
								   to land on the 960px bucket — a ~170 KB file for a
								   thumbnail-sized box. */
								sizes="144px"
								widths={[250, 500]}
								width={144}
								height={108}
								eager
								className="h-full w-full"
							/>
						)}
					</div>
					{/* Shuffle button */}
					<button
						type="button"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onShuffle();
						}}
						className="absolute bottom-2 right-2 z-10 cursor-pointer rounded-full bg-background/80 p-1.5 text-muted-foreground ring-1 ring-border transition hover:bg-background hover:text-foreground"
						title="Shuffle"
					>
						<ShuffleIcon className="h-3.5 w-3.5" />
					</button>
				</div>
				<div className="text-xs">
					<span className="font-medium">{name}</span>
					<span className="text-muted-foreground"> · </span>
					<span className="italic text-muted-foreground">{scientificName}</span>
				</div>
			</Link>
		</div>
	);
}

function HomePage() {
	const { q = "", page = 1, sort, dir } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const { names, isLoading, error, status } = useDatabase();

	// Defer the search query so expensive Fuse.js search doesn't block UI
	const deferredQuery = useDeferredValue(q);
	const searchResults = useSearch(deferredQuery);

	// Seed for the table's random order. Stable for the whole session (and across
	// pagination) until the user presses Shuffle.
	const [shuffleSeed, setShuffleSeed] = useState(getInitialShuffleSeed);
	const [heroShuffleKey, setHeroShuffleKey] = useState(() => {
		const stored = getStoredValue("heroShuffleKey");
		return stored ? Number.parseInt(stored, 10) || 0 : 0;
	});

	const shuffleTable = () => {
		const next = nextSeed();
		setStoredValue("shuffleSeed", String(next));
		setShuffleSeed(next);
	};

	// Draw a real seed once after mount so the first render is SSR-stable but the
	// order still varies between sessions.
	useEffect(() => {
		if (shuffleSeed === 0) {
			const next = nextSeed();
			setStoredValue("shuffleSeed", String(next));
			setShuffleSeed(next);
		}
	}, [shuffleSeed]);

	const shuffleHero = () => {
		setHeroShuffleKey((k) => {
			const next = k + 1;
			setStoredValue("heroShuffleKey", String(next));
			return next;
		});
	};

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

	// Use search results if query is 2+ chars, otherwise show every name
	const isValidSearch = deferredQuery.trim().length >= 2;
	const results = isValidSearch ? searchResults : names;

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

	const displayResults = useMemo(() => results.map(getItem), [results]);

	// The search needs the whole table in memory, so this screen — and only this
	// screen — waits for the sqlite-wasm database. It used to live in
	// DatabaseProvider, where it blocked every route from ever rendering on the
	// server. The prerendered `/` is therefore this state; the detail pages are
	// fully rendered.
	if (isLoading || error) {
		return (
			<main className="flex min-h-[60vh] items-center justify-center px-4">
				{error ? (
					<div className="text-center text-destructive">
						<div className="mb-4 text-4xl">❌</div>
						<div>Error: {error}</div>
					</div>
				) : (
					<div className="text-center">
						<div className="mb-4 text-4xl">🐟</div>
						<div className="text-muted-foreground">{status}</div>
					</div>
				)}
			</main>
		);
	}

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

			<div className="my-3">
				<NamesTable
					data={displayResults}
					isSearch={isValidSearch}
					randomSeed={shuffleSeed}
					onShuffle={shuffleTable}
					onClearSearch={
						isValidSearch
							? () => navigate({ search: { q: undefined } })
							: undefined
					}
					page={page}
					onPageChange={(nextPage) =>
						navigate({
							search: (prev) => ({
								...prev,
								page: nextPage > 1 ? nextPage : undefined,
							}),
						})
					}
					sort={sort ?? DEFAULT_SORT_VALUE}
					sortDesc={dir === "desc"}
					onSortChange={(nextSort, desc) =>
						navigate({
							search: (prev) => ({
								...prev,
								sort: nextSort === DEFAULT_SORT_VALUE ? undefined : nextSort,
								dir: desc ? "desc" : undefined,
								page: undefined,
							}),
						})
					}
					onRowSelect={(item) => {
						trackDetailView(item.id, item.name);
						navigate({ to: "/name/$id", params: { id: item.id } });
					}}
				/>
			</div>
		</main>
	);
}
