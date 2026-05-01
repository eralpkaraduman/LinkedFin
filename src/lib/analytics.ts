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

function trackEvent(
	eventName: string,
	eventData?: Record<string, string | number>,
) {
	if (typeof window !== "undefined" && window.umami) {
		window.umami.track(eventName, eventData);
	}
}

export function trackDetailView(nameId: string, name: string) {
	trackEvent("view_detail", { name_id: nameId, name });
}

export function trackSearch(query: string, resultCount: number) {
	if (query.trim().length >= 2) {
		trackEvent("search", { query, result_count: resultCount });
	}
}
