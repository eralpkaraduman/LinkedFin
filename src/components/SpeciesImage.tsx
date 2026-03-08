import { useEffect, useState } from "react";

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
 * 2. Small image - contained, blur shows through edges
 * 3. Large image - same as small, only rendered if large=true
 *
 * Images fade in when loaded. Cached images appear instantly.
 */
export function SpeciesImage({
	imageUrl,
	alt,
	large = false,
	className = "",
}: SpeciesImageProps) {
	const [smallLoaded, setSmallLoaded] = useState(false);
	const [largeLoaded, setLargeLoaded] = useState(false);

	// Reset loaded states when image URL changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: imageUrl triggers reset intentionally
	useEffect(() => {
		setSmallLoaded(false);
		setLargeLoaded(false);
	}, [imageUrl]);

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
				onLoad={() => setSmallLoaded(true)}
				className={`absolute inset-0 h-full w-full scale-125 object-cover blur-lg transition-opacity duration-300 will-change-[opacity] ${smallLoaded ? "opacity-100" : "opacity-0"}`}
			/>

			{/* Layer 2: Small image */}
			<img
				src={smallUrl}
				alt={alt}
				className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 will-change-[opacity] ${smallLoaded ? "opacity-100" : "opacity-0"}`}
			/>

			{/* Layer 3: Large image (only if large=true) */}
			{large && (
				<img
					src={largeUrl}
					alt={alt}
					onLoad={() => setLargeLoaded(true)}
					className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 will-change-[opacity] ${largeLoaded ? "opacity-100" : "opacity-0"}`}
				/>
			)}
		</div>
	);
}
