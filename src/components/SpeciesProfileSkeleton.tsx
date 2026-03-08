/**
 * Skeleton loading state for SpeciesProfile.
 * Matches the layout of SpeciesProfile for smooth transition.
 */
export function SpeciesProfileSkeleton() {
	return (
		<div className="space-y-4">
			{/* Image skeleton */}
			<div className="aspect-[3/2] w-full animate-pulse rounded-lg bg-muted-foreground/20" />

			{/* Wikipedia link skeleton */}
			<div className="h-5 w-24 animate-pulse rounded bg-muted-foreground/20" />

			{/* Description skeleton */}
			<div className="space-y-2">
				<div className="h-4 w-full animate-pulse rounded bg-muted-foreground/20" />
				<div className="h-4 w-3/4 animate-pulse rounded bg-muted-foreground/20" />
				<div className="h-4 w-5/6 animate-pulse rounded bg-muted-foreground/20" />
			</div>

			{/* Names section skeleton */}
			<div className="space-y-3">
				<div className="h-3 w-20 animate-pulse rounded bg-muted-foreground/20" />
				<div className="flex flex-wrap gap-2">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="h-14 w-28 animate-pulse rounded-lg bg-muted-foreground/20"
						/>
					))}
				</div>
			</div>
		</div>
	);
}
