import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { NameDetail } from "#/components/NameDetail";
import { ShareActions } from "#/components/ShareActions";
import { SpeciesCard } from "#/components/SpeciesCard";
import { useDatabase } from "#/lib/DatabaseContext";

export const Route = createFileRoute("/name/$id")({
	component: DetailPage,
});

function DetailPage() {
	const { id } = Route.useParams();
	const { getNameById } = useDatabase();

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
				<div className="mb-6 flex items-start justify-between gap-4">
					<div>
						<Link
							to="/"
							search={{}}
							className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
						>
							<ArrowLeftIcon className="h-4 w-4" />
							Back to search
						</Link>
						<h1 className="text-2xl font-bold">{name.name}</h1>
					</div>
					<ShareActions
						title={`LinkedFin: ${name.name}`}
						text={name.etymology || name.scientific_name}
					/>
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
