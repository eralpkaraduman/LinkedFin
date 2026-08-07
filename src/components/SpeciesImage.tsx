import { useEffect, useState } from "react";
import { commonsSrcSet, commonsThumbUrl } from "#/lib/commonsImage";

interface SpeciesImageProps {
	/** Commons file name, e.g. `Salmon.jpg`. Not a URL. */
	file: string | null | undefined;
	alt: string;
	/**
	 * `sizes` for the sharp layer. The slot is always CSS-sized by the parent,
	 * so this is what decides which thumbnail bucket the browser downloads —
	 * get it wrong and we ship a 960px file into a 144px box.
	 */
	sizes: string;
	/** Candidate widths offered in `srcset`, rounded up to served buckets. */
	widths: number[];
	/**
	 * `true` only for images that can plausibly be the LCP element (the home
	 * hero, the first image on a species page). Lazy-loading an LCP candidate
	 * delays it; lazy-loading anything else saves the bytes outright.
	 */
	eager?: boolean;
	/** Intrinsic box, so the aspect ratio survives even without the CSS. */
	width: number;
	height: number;
	className?: string;
}

/** Blurred backdrop never needs detail — one small bucket for every slot. */
const BLUR_WIDTH = 120;

/**
 * Species image with 3 layers:
 * 1. Blur layer - small image, covers entire area, blurred backdrop
 * 2. Small image - the same small file, contained, blur shows through edges
 * 3. Sharp image - full-resolution for the slot
 *
 * Images fade in when loaded. Cached images appear instantly.
 */
export function SpeciesImage({
	file,
	alt,
	sizes,
	widths,
	eager = false,
	width,
	height,
	className = "",
}: SpeciesImageProps) {
	const [smallLoaded, setSmallLoaded] = useState(false);
	const [sharpLoaded, setSharpLoaded] = useState(false);

	// Reset loaded states when the file changes
	// biome-ignore lint/correctness/useExhaustiveDependencies: file triggers reset intentionally
	useEffect(() => {
		setSmallLoaded(false);
		setSharpLoaded(false);
	}, [file]);

	if (!file) {
		return (
			<div
				className={`flex items-center justify-center bg-muted text-4xl ${className}`}
			>
				🐟
			</div>
		);
	}

	const smallUrl = commonsThumbUrl(file, BLUR_WIDTH);
	const loading = eager ? "eager" : "lazy";
	// Slots no bigger than the blur file get no third layer: fetching a second,
	// sharper copy of a 40px thumbnail would cost a whole extra request to
	// deliver bytes the browser already has.
	const needsSharpLayer = Math.max(...widths) > BLUR_WIDTH;

	return (
		<div
			className={`pointer-events-none relative flex items-center justify-center overflow-hidden bg-muted ${className}`}
		>
			{/* Layer 1: Blur backdrop */}
			<img
				src={smallUrl}
				alt=""
				aria-hidden="true"
				loading={loading}
				decoding="async"
				width={width}
				height={height}
				onLoad={() => setSmallLoaded(true)}
				className={`absolute inset-0 h-full w-full scale-125 object-cover blur-lg transition-opacity duration-300 will-change-[opacity] ${smallLoaded ? "opacity-100" : "opacity-0"}`}
			/>

			{/* Layer 2: Small image, a placeholder until the sharp one arrives */}
			<img
				src={smallUrl}
				alt={alt}
				loading={loading}
				decoding="async"
				width={width}
				height={height}
				className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 will-change-[opacity] ${smallLoaded ? "opacity-100" : "opacity-0"}`}
			/>

			{/* Layer 3: Sharp image at the slot's real size */}
			{needsSharpLayer && (
				<img
					src={commonsThumbUrl(file, Math.max(...widths))}
					srcSet={commonsSrcSet(file, widths)}
					sizes={sizes}
					alt={alt}
					loading={loading}
					decoding="async"
					fetchPriority={eager ? "high" : undefined}
					width={width}
					height={height}
					onLoad={() => setSharpLoaded(true)}
					className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 will-change-[opacity] ${sharpLoaded ? "opacity-100" : "opacity-0"}`}
				/>
			)}
		</div>
	);
}
