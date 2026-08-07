import { createFileRoute, Link } from "@tanstack/react-router";
import { BackButton, SiblingNav } from "#/components/DetailNav";
import { ErrorBoundary } from "#/components/ErrorBoundary";
import { ShareActions } from "#/components/ShareActions";
import { SpeciesProfile } from "#/components/SpeciesProfile";
import { loadFishData } from "#/lib/fishData";
import { selectSpeciesPage, speciesPageMeta } from "#/lib/pageData";
import { canonical } from "#/lib/site";

export const Route = createFileRoute("/species/$id")({
	/** See the sibling comment on `/name/$id` — same isomorphic loader story. */
	loader: async ({ params }) =>
		selectSpeciesPage(await loadFishData(), params.id),
	staleTime: Number.POSITIVE_INFINITY,
	head: ({ loaderData, params }) => {
		const links = [
			{ rel: "canonical", href: canonical(`/species/${params.id}`) },
		];
		if (!loaderData) return { links };
		const { title, description } = speciesPageMeta(loaderData);
		return {
			meta: [{ title }, { name: "description", content: description }],
			links,
		};
	},
	component: SpeciesPage,
});

function SpeciesPage() {
	const { id } = Route.useParams();
	const page = Route.useLoaderData();

	if (!page) {
		return (
			<main className="page-wrap px-4 py-8">
				<div className="text-center">
					<p className="mb-4 text-muted-foreground">Species not found: {id}</p>
					<Link to="/" search={{}} className="text-primary hover:underline">
						Back to search
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="page-wrap px-4 py-8">
			<div className="mx-auto max-w-2xl">
				<div className="mb-2 flex items-center justify-between gap-4">
					<BackButton />
					<SiblingNav
						to="/species/$id"
						prev={page.prev}
						next={page.next}
						itemLabel="species"
					/>
				</div>
				<div className="mb-6 flex items-start justify-between gap-4">
					<h1 className="text-2xl font-bold italic">{page.scientificName}</h1>
					<ShareActions />
				</div>

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
						speciesId={id}
						scientificName={page.scientificName}
						speciesNotes={page.notes}
						names={page.names}
					/>
				</ErrorBoundary>
			</div>
		</main>
	);
}
