import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { ErrorBoundary } from "#/components/ErrorBoundary";
import { ShareActions } from "#/components/ShareActions";
import { SpeciesProfile } from "#/components/SpeciesProfile";
import { useDatabase } from "#/lib/DatabaseContext";

export const Route = createFileRoute("/species/$id")({
	component: SpeciesPage,
});

function SpeciesPage() {
	const { id } = Route.useParams();
	const { getSpeciesInfo } = useDatabase();

	const species = getSpeciesInfo(id);

	if (!species) {
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
						<h1 className="text-2xl font-bold italic">
							{species.scientific_name}
						</h1>
					</div>
					<ShareActions title={`LinkedFin: ${species.scientific_name}`} />
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
						scientificName={species.scientific_name}
						speciesNotes={species.notes}
					/>
				</ErrorBoundary>
			</div>
		</main>
	);
}
