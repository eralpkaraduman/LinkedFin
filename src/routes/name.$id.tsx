import { createFileRoute, Link } from "@tanstack/react-router";
import { BackButton, SiblingNav } from "#/components/DetailNav";
import { NameDetail } from "#/components/NameDetail";
import { ShareActions } from "#/components/ShareActions";
import { SpeciesCard } from "#/components/SpeciesCard";
import { loadFishData } from "#/lib/fishData";
import { buildHead } from "#/lib/head";
import { toBcp47 } from "#/lib/language";
import { selectNamePage } from "#/lib/pageData";
import { buildNameJsonLd } from "#/shared/jsonld";
import { buildNameMeta, GENERIC_META } from "#/shared/pageMeta";

export const Route = createFileRoute("/name/$id")({
	/**
	 * Runs in Node during prerendering and in the browser on client-side
	 * navigation — see `loadFishData`. Its result is dehydrated into the
	 * prerendered HTML and reused on hydration, so a crawler (and a reader with
	 * a cold cache) gets the name, its etymology and its links without running
	 * any JavaScript and without waiting for the 296 KB sqlite database.
	 *
	 * Returns `null` rather than throwing `notFound()` for an unknown id: every
	 * real id is prerendered, so this only happens for a dead link, and a plain
	 * 200 with an explanation is what the app has always served there.
	 */
	loader: async ({ params }) => selectNamePage(await loadFishData(), params.id),
	/**
	 * The dataset only changes when the site is rebuilt, so loader data never
	 * goes stale within a session. Without this the router would refetch on
	 * mount and pull down the whole database just to re-derive what is already
	 * in the HTML.
	 */
	staleTime: Number.POSITIVE_INFINITY,
	head: ({ loaderData, params }) => {
		const path = `/name/${params.id}`;
		if (!loaderData) {
			return buildHead({ path, meta: GENERIC_META, indexable: false });
		}
		return buildHead({
			path,
			meta: buildNameMeta(loaderData.name),
			jsonLd: buildNameJsonLd(params.id, loaderData.name),
		});
	},
	component: DetailPage,
});

function DetailPage() {
	const { id } = Route.useParams();
	const page = Route.useLoaderData();

	if (!page) {
		return (
			<main className="page-wrap px-4 py-8">
				<div className="text-center">
					<p className="mb-4 text-muted-foreground">Name not found: {id}</p>
					<Link to="/" search={{}} className="text-primary hover:underline">
						Back to search
					</Link>
				</div>
			</main>
		);
	}

	const { name, relations, related, prev, next } = page;
	const byId = new Map(related.map((entry) => [entry.id, entry]));
	const sameSpecies = related.filter((n) => n.species_id === name.species_id);

	return (
		<main className="page-wrap px-4 py-8">
			<div className="mx-auto max-w-2xl">
				<div className="mb-2 flex items-center justify-between gap-4">
					<BackButton />
					<SiblingNav to="/name/$id" prev={prev} next={next} itemLabel="name" />
				</div>
				<div className="mb-6 flex items-start justify-between gap-4">
					{/* The heading is the name itself, in its own language — the rest
					    of the page (chrome, labels, etymology prose) stays English. */}
					<h1
						className="text-2xl font-bold"
						lang={toBcp47(name.lang)}
						dir="auto"
					>
						{name.name}
					</h1>
					<ShareActions />
				</div>

				<div className="space-y-4">
					<SpeciesCard
						speciesId={name.species_id}
						scientificName={name.scientific_name}
					/>
					<NameDetail
						name={name}
						relations={relations}
						getNameById={(entryId) => byId.get(entryId)}
						sameSpecies={sameSpecies}
					/>
				</div>
			</div>
		</main>
	);
}
