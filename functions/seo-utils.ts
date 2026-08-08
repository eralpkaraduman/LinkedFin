/**
 * SEO helpers for the Pages Functions middleware.
 *
 * Kept separate from _middleware.ts so the logic is unit-testable — the
 * middleware itself depends on the Workers runtime (HTMLRewriter).
 */

/** Routes that exist independently of the database. */
const STATIC_ROUTES = new Set(["/", "/about"]);

/**
 * Database-backed routes. `/region/:id` belongs here too — its pages are
 * prerendered and in the sitemap, and leaving it out would have served all 23
 * of them `noindex, follow` while looking perfectly healthy.
 */
const DETAIL_ROUTE = /^\/(?:name|species|region)\/[^/]+$/;

/**
 * Normalize a pathname for comparison and canonicalisation.
 *
 * Cloudflare Pages will serve `/about` and `/about/` as the same document, so
 * they must not become two indexable URLs.
 */
export function normalizePath(pathname: string): string {
	if (pathname.length > 1 && pathname.endsWith("/")) {
		return pathname.replace(/\/+$/, "") || "/";
	}
	return pathname;
}

/**
 * Whether a path should be indexed.
 *
 * Cloudflare Pages' SPA fallback serves the app shell with a 200 for ANY path,
 * so unknown routes and dead ids look like real pages to a crawler and get
 * classified as soft 404s. Only the static routes and detail pages whose id
 * actually resolves are indexable.
 *
 * @param entryResolved whether the id in a /name/, /species/ or /region/ path
 *   was found
 */
export function isIndexable(pathname: string, entryResolved: boolean): boolean {
	const path = normalizePath(pathname);
	if (STATIC_ROUTES.has(path)) return true;
	if (DETAIL_ROUTE.test(path)) return entryResolved;
	return false;
}
