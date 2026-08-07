import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 60, // 1 hour
			/**
			 * `Infinity` on the server, and that is load-bearing, not a tuning
			 * choice. Building a Query schedules a garbage-collection `setTimeout`
			 * of `gcTime`, and a 24-hour timer holds Node's event loop open — the
			 * prerender would render all 620 pages, write them, and then hang
			 * forever instead of exiting, failing the deploy. React Query skips
			 * scheduling entirely when `gcTime` is `Infinity`, and nothing needs
			 * collecting in a process that exits after the build anyway.
			 */
			gcTime: import.meta.env.SSR
				? Number.POSITIVE_INFINITY
				: 1000 * 60 * 60 * 24, // 24 hours
			retry: 1,
		},
	},
});
