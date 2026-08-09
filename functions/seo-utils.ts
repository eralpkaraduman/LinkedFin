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

/**
 * Whether the middleware should replace a 200 response with a real 404.
 *
 * Deleting a record removes it from the database, the build and the sitemap,
 * but the old HTML can survive in Cloudflare Pages' asset store, held by
 * deployments that predate the deletion. `nm_0438` did exactly that: the
 * current deployment 404'd, the production URL kept serving the full old page,
 * and three zone purges — two by-URL and one Purge Everything — could not touch
 * it, because zone purges do not reach the asset layer. The Function wrapping
 * that stale asset is always the current one, so the middleware can see the id
 * no longer resolves even while the body it wraps is stale. This is the
 * middleware acting on what it already knows.
 *
 * @param pathname     request path
 * @param status       status the origin/asset store returned
 * @param entryResolved whether the id was found in the lookup table
 * @param tableSize    number of entries in the lookup table for THIS path type
 *   (names/species/regions), or 0 when the path is not a detail route
 *
 * THE GUARD — `tableSize > 0` is load-bearing, do not remove it. It is not a
 * restatement of `!entryResolved`. If `og-data.json` were ever empty, missing
 * or malformed in a deployment, every id would fail to resolve and every detail
 * page would still return 200 from its asset — so without this check we would
 * 404 all 645 pages of the site at once, from a data problem that is otherwise
 * invisible and self-inflicted. An empty table means "we do not know anything",
 * not "nothing exists". In that state we do nothing and fall through to the
 * existing behaviour: one stale page is vastly better than a dead site.
 */
export function shouldServeGone(
	pathname: string,
	status: number,
	entryResolved: boolean,
	tableSize: number,
): boolean {
	if (status !== 200) return false;
	if (entryResolved) return false;
	if (tableSize <= 0) return false;
	return DETAIL_ROUTE.test(normalizePath(pathname));
}
