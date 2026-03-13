import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";
import { SpeciesImage } from "#/components/SpeciesImage";
import { useWikidataSpecies } from "#/hooks/useWikidataSpecies";

interface SpeciesCardProps {
	speciesId: string;
	scientificName: string;
}

export function SpeciesCard({ speciesId, scientificName }: SpeciesCardProps) {
	const { data, isLoading } = useWikidataSpecies(scientificName);

	return (
		<Link
			to="/species/$id"
			params={{ id: speciesId }}
			className="flex w-full items-center gap-3 rounded-lg border bg-muted/30 p-2 text-left transition hover:bg-muted/50"
		>
			{/* Thumbnail with letterbox */}
			<div className="h-10 w-10 shrink-0 overflow-hidden rounded">
				{isLoading ? (
					<div className="h-full w-full animate-pulse bg-muted-foreground/20" />
				) : (
					<SpeciesImage
						imageUrl={data?.imageUrl}
						alt={scientificName}
						large={false}
						className="h-full w-full"
					/>
				)}
			</div>

			{/* Text content */}
			<div className="min-w-0 flex-1">
				<div className="truncate font-medium italic">{scientificName}</div>
			</div>

			{/* Chevron */}
			<ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
		</Link>
	);
}
