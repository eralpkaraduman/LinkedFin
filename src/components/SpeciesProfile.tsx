import { Link } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { SpeciesImage } from "#/components/SpeciesImage";
import {
	Carousel,
	type CarouselApi,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "#/components/ui/carousel";
import { useWikidataSpecies } from "#/hooks/useWikidataSpecies";
import { useDatabase } from "#/lib/DatabaseContext";
import { toBcp47 } from "#/lib/language";
import type { FishName } from "#/lib/types";

/**
 * The gallery sits in `max-w-2xl` (672px) inside `page-wrap px-4`, so it is
 * 672 CSS px once the viewport clears 672 + 4rem of gutters, and
 * `100vw - 4rem` below that. Measured in the browser, not guessed.
 */
const GALLERY_SIZES = "(min-width: 736px) 672px, calc(100vw - 4rem)";
const GALLERY_WIDTHS = [250, 500, 960, 1280];

interface SpeciesProfileProps {
	speciesId: string;
	scientificName: string;
	speciesNotes?: string | null;
	/**
	 * Supplied by the route loader so the names list is present in prerendered
	 * HTML. Falls back to the client-side database context.
	 */
	names?: FishName[];
}

function buildGitHubIssueUrl(
	speciesId: string,
	scientificName: string,
): string {
	const title = encodeURIComponent(`[${speciesId}] ${scientificName}: `);
	const body = encodeURIComponent(
		`**Species ID:** ${speciesId}\n**Scientific name:** ${scientificName}\n\n**Request:**\n`,
	);
	return `https://github.com/eralpkaraduman/LinkedFin/issues/new?title=${title}&body=${body}`;
}

export function SpeciesProfile({
	speciesId,
	scientificName,
	speciesNotes,
	names: namesProp,
}: SpeciesProfileProps) {
	const { data, isLoading, error } = useWikidataSpecies(scientificName);
	const { getNamesBySpecies } = useDatabase();
	const names = namesProp ?? getNamesBySpecies(speciesId);

	// Carousel state for image counter (must be before early return)
	const [carouselApi, setCarouselApi] = useState<CarouselApi>();
	const [currentSlide, setCurrentSlide] = useState(0);

	useEffect(() => {
		if (!carouselApi) return;
		setCurrentSlide(carouselApi.selectedScrollSnap());
		carouselApi.on("select", () => {
			setCurrentSlide(carouselApi.selectedScrollSnap());
		});
	}, [carouselApi]);

	const imageFiles = data?.imageFiles ?? [];
	const hasMultipleImages = imageFiles.length > 1;

	// Detect vague Wikidata descriptions that should be replaced by local notes
	const vagueDescriptionPatterns = [
		/^species of (fish|animal|ray-finned fish|organism)$/i,
		/^taxon$/i,
	];
	const isVagueDescription =
		data?.description &&
		vagueDescriptionPatterns.some((pattern) =>
			pattern.test(data.description.trim()),
		);

	// Use species notes as primary description if Wikidata description is vague
	const primaryDescription =
		isVagueDescription && speciesNotes ? speciesNotes : data?.description;
	const showSpeciesNotesSecondary =
		speciesNotes && !isVagueDescription && data?.description;

	return (
		<div className="space-y-4">
			{/* Image gallery. Wikidata is fetched in the browser, so this area is
			    still a skeleton in the prerendered HTML — everything below it (the
			    notes and the name list) is not, and that is the part worth
			    indexing. */}
			{isLoading ? (
				<div className="aspect-[3/2] w-full animate-pulse rounded-lg bg-muted-foreground/20" />
			) : hasMultipleImages ? (
				<div className="space-y-2">
					<Carousel
						className="mx-auto w-full"
						opts={{ loop: true }}
						setApi={setCarouselApi}
					>
						<CarouselContent>
							{imageFiles.map((file, index) => (
								<CarouselItem key={file}>
									<div className="overflow-hidden rounded-lg">
										<SpeciesImage
											file={file}
											alt={`${scientificName} - Image ${index + 1}`}
											sizes={GALLERY_SIZES}
											widths={GALLERY_WIDTHS}
											width={600}
											height={400}
											/* Only the first slide is on screen at load, and
											   it is the LCP candidate for this page. */
											eager={index === 0}
											className="aspect-[3/2] w-full"
										/>
									</div>
								</CarouselItem>
							))}
						</CarouselContent>
						<CarouselPrevious className="left-2 bg-background/80 backdrop-blur-sm" />
						<CarouselNext className="right-2 bg-background/80 backdrop-blur-sm" />
					</Carousel>
					{/* Image counter dots */}
					<div className="flex justify-center gap-1.5">
						{imageFiles.map((file, index) => (
							<button
								key={file}
								type="button"
								onClick={() => carouselApi?.scrollTo(index)}
								className={`h-1.5 rounded-full transition-all ${
									index === currentSlide
										? "w-4 bg-primary"
										: "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
								}`}
								aria-label={`Go to image ${index + 1}`}
							/>
						))}
					</div>
				</div>
			) : (
				<div className="overflow-hidden rounded-lg">
					<SpeciesImage
						file={data?.imageFile}
						alt={scientificName}
						sizes={GALLERY_SIZES}
						widths={GALLERY_WIDTHS}
						width={600}
						height={400}
						eager
						className="aspect-[3/2] w-full"
					/>
				</div>
			)}

			{/* Wikipedia link */}
			{data?.wikipediaUrl && (
				<a
					href={data.wikipediaUrl}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
				>
					Wikipedia
					<ExternalLinkIcon className="h-3.5 w-3.5" />
				</a>
			)}

			{/* Description */}
			<div className="space-y-3">
				{isLoading && !speciesNotes ? (
					<div className="space-y-2">
						<div className="h-4 w-full animate-pulse rounded bg-muted-foreground/20" />
						<div className="h-4 w-3/4 animate-pulse rounded bg-muted-foreground/20" />
					</div>
				) : error ? (
					<p className="text-sm text-muted-foreground">
						Could not load information from Wikipedia.
					</p>
				) : primaryDescription ? (
					<p className="text-sm leading-relaxed">{primaryDescription}</p>
				) : speciesNotes ? (
					<p className="text-sm leading-relaxed">{speciesNotes}</p>
				) : (
					<p className="text-sm text-muted-foreground">
						No Wikipedia article found for this species.
					</p>
				)}

				{/* Local species notes as secondary info when Wikidata description is good */}
				{showSpeciesNotesSecondary && (
					<p className="border-l-2 border-muted-foreground/30 pl-3 text-sm text-muted-foreground">
						{speciesNotes}
					</p>
				)}
			</div>

			{/* Names for this species */}
			{names.length > 0 && (
				<div className="space-y-3">
					<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Names ({names.length})
					</h3>
					<div className="flex flex-wrap gap-2">
						{names.map((name) => (
							<Link
								key={name.id}
								to="/name/$id"
								params={{ id: name.id }}
								className="rounded-lg bg-muted/50 px-3 py-2 text-left transition hover:bg-muted"
							>
								<span
									className="block text-sm font-medium"
									lang={toBcp47(name.lang)}
									dir="auto"
								>
									{name.name}
								</span>
								<span className="block text-xs text-muted-foreground">
									{name.region}
								</span>
							</Link>
						))}
					</div>
				</div>
			)}

			{/* Report Issue link */}
			<div className="border-t border-border pt-4 text-center">
				<a
					href={buildGitHubIssueUrl(speciesId, scientificName)}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
				>
					<svg
						viewBox="0 0 16 16"
						width="14"
						height="14"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
					</svg>
					Report an update for this species
				</a>
			</div>

			{/* Bottom spacer with safe area */}
			<div className="min-h-[calc(1rem+env(safe-area-inset-bottom,0px))]" />
		</div>
	);
}
