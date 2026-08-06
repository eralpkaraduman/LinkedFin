import { createFileRoute, Link } from "@tanstack/react-router";
import { BackButton, SiblingNav } from "#/components/DetailNav";
import { NameDetail } from "#/components/NameDetail";
import { ShareActions } from "#/components/ShareActions";
import { SpeciesCard } from "#/components/SpeciesCard";
import { useNameSiblings } from "#/hooks/useSiblingNavigation";
import { useDatabase } from "#/lib/DatabaseContext";

export const Route = createFileRoute("/name/$id")({
	component: DetailPage,
});

function DetailPage() {
	const { id } = Route.useParams();
	const { getNameById } = useDatabase();
	const { prev, next } = useNameSiblings(id);

	const name = getNameById(id);

	if (!name) {
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

	return (
		<main className="page-wrap px-4 py-8">
			<div className="mx-auto max-w-2xl">
				<div className="mb-2 flex items-center justify-between gap-4">
					<BackButton />
					<SiblingNav to="/name/$id" prev={prev} next={next} itemLabel="name" />
				</div>
				<div className="mb-6 flex items-start justify-between gap-4">
					<h1 className="text-2xl font-bold">{name.name}</h1>
					<ShareActions />
				</div>

				<div className="space-y-4">
					<SpeciesCard
						speciesId={name.species_id}
						scientificName={name.scientific_name}
					/>
					<NameDetail name={name} />
				</div>
			</div>
		</main>
	);
}
