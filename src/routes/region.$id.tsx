import { createFileRoute, Link } from "@tanstack/react-router";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { NamesTable } from "#/components/NamesTable";
import { trackDetailView } from "#/lib/analytics";
import { loadFishData } from "#/lib/fishData";
import { regionPageMeta, selectRegionPage } from "#/lib/pageData";
import { nextSeed } from "#/lib/randomOrder";
import { canonical } from "#/lib/site";

export const Route = createFileRoute("/region/$id")({
	/**
	 * Same isomorphic loader as `/name/$id` and `/species/$id`: `virtual:fish-data`
	 * in Node at prerender time, sqlite-wasm in the browser on client-side
	 * navigation. This is what makes the page real HTML — the homepage table has
	 * no loader and renders from `useDatabase()` after hydration, so copying that
	 * approach here would have produced 23 empty shells.
	 */
	loader: async ({ params }) =>
		selectRegionPage(await loadFishData(), params.id),
	staleTime: Number.POSITIVE_INFINITY,
	head: ({ loaderData, params }) => {
		const links = [
			{ rel: "canonical", href: canonical(`/region/${params.id}`) },
		];
		if (!loaderData) return { links };
		const { title, description } = regionPageMeta(loaderData);
		return {
			meta: [{ title }, { name: "description", content: description }],
			links,
		};
	},
	component: RegionPage,
});

function RegionPage() {
	const { id } = Route.useParams();
	const page = Route.useLoaderData();
	// Only consulted when the reader switches the sort mode to "Random"; the
	// default order below is alphabetical, so the first render is deterministic.
	const [shuffleSeed, setShuffleSeed] = useState(0);
	const [sort, setSort] = useState("name");
	const [sortDesc, setSortDesc] = useState(false);

	if (!page) {
		return (
			<main className="page-wrap px-4 py-8">
				<div className="text-center">
					<p className="mb-4 text-muted-foreground">Region not found: {id}</p>
					<Link to="/" search={{}} className="text-primary hover:underline">
						Back to search
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="page-wrap flex flex-col px-4 py-8">
			<div className="mb-4 flex flex-wrap items-center gap-2">
				<h1 className="text-2xl font-bold">Fish names from {page.name}</h1>
			</div>

			{/* The active filter, as a removable pill: dropping it is the way back
			    to the unfiltered table on `/`. */}
			<div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
				<span>Region</span>
				<span
					data-testid="region-pill"
					className="inline-flex items-center gap-1 rounded-full border border-border bg-muted py-1 pl-3 pr-1.5 text-sm text-foreground"
				>
					{page.name}
					<Link
						to="/"
						search={{}}
						aria-label={`Remove the ${page.name} filter`}
						title="Show all regions"
						className="inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground transition hover:bg-background hover:text-foreground"
					>
						<XIcon className="h-3.5 w-3.5" />
					</Link>
				</span>
			</div>

			{/*
			 * `pageSize` is the whole region, deliberately — this is the one table
			 * in the app that does not paginate. The page is prerendered, and with
			 * the homepage's 10 rows per page only the first ten names would be
			 * linked from the HTML a crawler sees. The largest region
			 * (International) is 108 rows, which is a fine browse page.
			 */}
			<NamesTable
				data={page.names}
				isSearch={false}
				pageSize={page.names.length}
				randomSeed={shuffleSeed}
				onShuffle={() => setShuffleSeed(nextSeed())}
				sort={sort}
				sortDesc={sortDesc}
				onSortChange={(nextSort, desc) => {
					setSort(nextSort);
					setSortDesc(desc);
				}}
				onRowSelect={(item) => trackDetailView(item.id, item.name)}
			/>
		</main>
	);
}
