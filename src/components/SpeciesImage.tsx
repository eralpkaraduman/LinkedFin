interface SpeciesImageProps {
	imageUrl: string | null | undefined;
	alt: string;
	large?: boolean;
	className?: string;
}

function setImageWidth(url: string, width: number): string {
	try {
		const parsed = new URL(url);
		parsed.searchParams.set("width", String(width));
		return parsed.toString();
	} catch {
		const sep = url.includes("?") ? "&" : "?";
		return `${url}${sep}width=${width}`;
	}
}

/**
 * Species image with 3 layers:
 * 1. Blur layer - small image, covers entire area, blurred backdrop
 * 2. Small image - contained/clipped, blur shows through edges
 * 3. Large image - same as small, only rendered if large=true
 */
export function SpeciesImage({
	imageUrl,
	alt,
	large = false,
	className = "",
}: SpeciesImageProps) {
	if (!imageUrl) {
		return (
			<div
				className={`flex items-center justify-center bg-muted text-4xl ${className}`}
			>
				🐟
			</div>
		);
	}

	const smallUrl = setImageWidth(imageUrl, 80);
	const largeUrl = setImageWidth(imageUrl, 600);

	return (
		<div
			className={`relative flex items-center justify-center overflow-hidden bg-muted ${className}`}
		>
			{/* Layer 1: Blur backdrop */}
			<img
				src={smallUrl}
				alt=""
				aria-hidden="true"
				className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-xl"
			/>

			{/* Layer 2: Small image */}
			<img
				src={smallUrl}
				alt={alt}
				className="relative max-h-full max-w-full object-contain"
			/>

			{/* Layer 3: Large image (only if large=true) */}
			{large && (
				<img
					src={largeUrl}
					alt={alt}
					className="absolute inset-0 h-full w-full object-contain"
				/>
			)}
		</div>
	);
}
