import { useEffect, useRef, useState } from "react";

interface SpeciesImageProps {
	imageUrl: string | null | undefined;
	alt: string;
	large?: boolean;
	className?: string;
}

// LRU-style cache to track loaded URLs (prevents unbounded growth)
const MAX_CACHE_SIZE = 100;
const loadedUrls = new Map<string, number>(); // url -> timestamp

function markUrlLoaded(url: string) {
	loadedUrls.set(url, Date.now());
	// Evict oldest entries if cache is too large
	if (loadedUrls.size > MAX_CACHE_SIZE) {
		const entries = Array.from(loadedUrls.entries());
		entries.sort((a, b) => a[1] - b[1]); // Sort by timestamp ascending
		const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE);
		for (const [url] of toRemove) {
			loadedUrls.delete(url);
		}
	}
}

function isUrlLoaded(url: string): boolean {
	return loadedUrls.has(url);
}

/**
 * Robust URL width modifier - handles both query params and path-based width.
 * Works with Commons URLs like: Special:FilePath/name.jpg?width=300
 */
function setImageWidth(
	imageUrl: string | null | undefined,
	width: number,
): string | undefined {
	if (!imageUrl) return undefined;
	try {
		const url = new URL(imageUrl);
		url.searchParams.set("width", String(width));
		return url.toString();
	} catch {
		// Fallback for malformed URLs - use simple replace
		if (imageUrl.includes("width=")) {
			return imageUrl.replace(/width=\d+/, `width=${width}`);
		}
		// Append width param
		const separator = imageUrl.includes("?") ? "&" : "?";
		return `${imageUrl}${separator}width=${width}`;
	}
}

/**
 * Unified species image component with letterbox effect.
 * - small (default): 80px image, no loading states
 * - large: 600px image, with loading animation (unless already loaded before)
 */
export function SpeciesImage({
	imageUrl,
	alt,
	large = false,
	className = "",
}: SpeciesImageProps) {
	const smallUrl = setImageWidth(imageUrl, 80);
	const largeUrl = setImageWidth(imageUrl, 600);
	const blurUrl = setImageWidth(imageUrl, 100);
	const mainUrl = large ? largeUrl : smallUrl;

	// Check if this URL was loaded before (persists across remounts)
	const wasLoadedBefore = mainUrl ? isUrlLoaded(mainUrl) : false;

	const [mainLoaded, setMainLoaded] = useState(wasLoadedBefore);
	const [blurLoaded, setBlurLoaded] = useState(false);

	// Track if it was loaded on mount (for animation decision)
	const wasCachedOnMount = useRef(wasLoadedBefore);

	// Reset state when URL changes
	useEffect(() => {
		const cached = mainUrl ? isUrlLoaded(mainUrl) : false;
		wasCachedOnMount.current = cached;
		setMainLoaded(cached);
		setBlurLoaded(false);
	}, [mainUrl]);

	const handleMainLoad = () => {
		if (mainUrl) {
			markUrlLoaded(mainUrl);
		}
		setMainLoaded(true);
	};

	const handleBlurLoad = () => {
		if (blurUrl) {
			markUrlLoaded(blurUrl);
		}
		setBlurLoaded(true);
	};

	if (!imageUrl) {
		return (
			<div
				className={`flex items-center justify-center bg-muted ${large ? "aspect-[3/2] text-6xl" : "h-full w-full text-lg"} ${className}`}
			>
				🐟
			</div>
		);
	}

	// Small images: no loading states, no animations - just show directly
	if (!large) {
		return (
			<div
				className={`relative flex items-center justify-center overflow-hidden bg-muted ${className}`}
			>
				{/* Blurred background */}
				{blurUrl && (
					<img
						src={blurUrl}
						alt=""
						aria-hidden="true"
						className="absolute inset-0 h-full w-full scale-125 object-cover opacity-60 blur-2xl"
					/>
				)}
				{/* Main image */}
				{mainUrl && (
					<img
						src={mainUrl}
						alt={alt}
						onLoad={handleMainLoad}
						className="relative max-h-full max-w-full object-contain"
					/>
				)}
			</div>
		);
	}

	// Large images: skeleton while loading, animations (unless was cached on mount)
	const shouldAnimate = !wasCachedOnMount.current;

	return (
		<div
			className={`relative flex items-center justify-center overflow-hidden bg-muted ${className}`}
		>
			{/* Skeleton */}
			{!mainLoaded && (
				<div className="absolute inset-0 animate-pulse bg-muted-foreground/20" />
			)}

			{/* Blurred background for letterbox effect */}
			{blurUrl && (
				<img
					src={blurUrl}
					alt=""
					aria-hidden="true"
					onLoad={handleBlurLoad}
					className={`absolute inset-0 h-full w-full scale-125 object-cover blur-2xl ${shouldAnimate ? "transition-opacity duration-200" : ""} ${blurLoaded ? "opacity-60" : "opacity-0"}`}
				/>
			)}

			{/* Main image - contained and centered */}
			{mainUrl && (
				<img
					src={mainUrl}
					alt={alt}
					onLoad={handleMainLoad}
					className={`relative max-h-full max-w-full object-contain ${shouldAnimate ? "transition-opacity duration-200" : ""} ${mainLoaded ? "opacity-100" : "opacity-0"}`}
				/>
			)}
		</div>
	);
}
