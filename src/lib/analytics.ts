/**
 * Umami analytics tracking utilities
 * @see https://umami.is/docs/tracker-functions
 */

declare global {
	interface Window {
		umami?: {
			track: (
				eventName: string,
				eventData?: Record<string, string | number>,
			) => void;
		};
	}
}

/**
 * Track a custom event
 */
export function trackEvent(
	eventName: string,
	eventData?: Record<string, string | number>,
) {
	if (typeof window !== "undefined" && window.umami) {
		window.umami.track(eventName, eventData);
	}
}

/**
 * Track modal/detail view opening
 */
export function trackDetailView(nameId: string, name: string) {
	trackEvent("view_detail", { name_id: nameId, name });
}

/**
 * Track search (debounced - call only after user stops typing)
 */
export function trackSearch(query: string, resultCount: number) {
	if (query.trim().length >= 2) {
		trackEvent("search", { query, result_count: resultCount });
	}
}

/**
 * Track link copy
 */
export function trackCopyLink(nameId: string) {
	trackEvent("copy_link", { name_id: nameId });
}
