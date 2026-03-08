import { useEffect, useState } from "react";

interface SpeciesImageProps {
	imageUrl: string | null | undefined;
	alt: string;
	large?: boolean; // Load high-res image with loading states
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

	// Track if main image is loaded (for skeleton display)
	const wasLoadedBefore = mainUrl ? isUrlLoaded(mainUrl) : false;
	const [mainLoaded, setMainLoaded] = useState(wasLoadedBefore);

	// Reset state when URL changes
	useEffect(() => {
		setMainLoaded(mainUrl ? isUrlLoaded(mainUrl) : false);
	}, [mainUrl]);

	const handleMainLoad = () => {
		if (mainUrl) {
			markUrlLoaded(mainUrl);
		}
		setMainLoaded(true);
	};

	if (!imageUrl) {
		return (
			<div
				className={`flex items-center justify-center bg-muted text-4xl ${className}`}
			>
				🐟
			</div>
		);
	}

	return (
		<div
			className={`relative flex items-center justify-center overflow-hidden bg-muted ${className}`}
		>
			{/* Skeleton overlay - only for large images while loading */}
			{large && !mainLoaded && (
				<div className="absolute inset-0 z-10 animate-pulse bg-muted-foreground/20" />
			)}

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
