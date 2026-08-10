/**
 * What the middleware still does, now that every real URL is a prerendered file.
 *
 * It used to append `og:*`, `twitter:*`, `robots` and the JSON-LD to every HTML
 * response with HTMLRewriter, because before prerendering that was the only
 * place that could reach the document a crawler fetches. Those tags now come
 * from each route's `head()` (see `src/lib/head.ts`) and are baked into the
 * file on disk. Emitting them here as well would give every page two `og:title`
 * tags, so this file emits none of them.
 *
 * What is left is the one thing only the edge can know: **paths with no
 * prerendered file behind them.**
 *
 * 1. A deleted record whose stale asset survives. `nm_0438` did exactly that —
 *    see `shouldServeGone` for the full story. The Function wrapping a stale
 *    asset is always the current one, so it can see that the id no longer
 *    resolves even while the body it wraps is stale.
 * 2. An unknown id or a dead URL. Cloudflare Pages answers those from the SPA
 *    shell (`404.html`), which is prerendered at the mask path `/` and
 *    therefore carries the *homepage's* head: `robots: index, follow`, a
 *    canonical pointing at `/`, and the WebSite/SearchAction entity. All three
 *    are wrong at a URL that does not exist, and only the edge knows the
 *    request was not for the homepage. So the shell's SEO block is stripped and
 *    replaced with `noindex`.
 *
 * The lookup tables come from `functions/og-data.json`, which still exists for
 * the OG image endpoint. All this file needs from it is existence and size.
 */

import data from "./og-data.json";
import { isIndexable, shouldServeGone } from "./seo-utils.ts";

const namesById = data.namesById as Record<string, unknown>;
const speciesById = data.speciesById as Record<string, unknown>;
const regionIds = new Set(data.regionIds as string[]);

/**
 * Sizes of the lookup tables, measured once at module init rather than per
 * request — `Object.keys()` on 513 names is not something to do on every hit.
 * These feed the guard in `shouldServeGone`; see that function for why an empty
 * table must never be treated as "nothing exists".
 */
const NAME_COUNT = Object.keys(namesById).length;
const SPECIES_COUNT = Object.keys(speciesById).length;
const REGION_COUNT = regionIds.size;

/** Cache-Control used for every HTML response, including the 404 body below. */
const HTML_CACHE_CONTROL = "public, max-age=0, must-revalidate";

/**
 * A minimal, self-contained 404. Deliberately not a fetch of the site's own 404
 * page: `next()` has already been consumed by the time we get here, and an
 * extra edge fetch would be a new way for this path to fail.
 */
function goneResponse(): Response {
	return new Response(
		`<!doctype html><html lang="en"><head><meta charset="utf-8" />` +
			`<meta name="viewport" content="width=device-width, initial-scale=1" />` +
			`<meta name="robots" content="noindex" />` +
			`<title>Not found — LinkedFin</title></head>` +
			`<body><h1>Not found</h1>` +
			`<p>This page no longer exists.</p>` +
			`<p><a href="/">Go to the LinkedFin home page</a></p>` +
			`</body></html>`,
		{
			status: 404,
			headers: {
				"content-type": "text/html; charset=utf-8",
				// Same revalidate-always policy as every other HTML response, so
				// the 404 itself cannot get pinned in a cache the way the page it
				// replaces did.
				"Cache-Control": HTML_CACHE_CONTROL,
			},
		},
	);
}

/**
 * Drop a tag the SPA shell inherited from the homepage's `head()`.
 *
 * Used for `link[rel=canonical]` and the JSON-LD block. At a URL that resolves
 * to nothing, a canonical pointing at `/` says "this dead link is the
 * homepage", and a WebSite/SearchAction entity claims a search box that this
 * page does not host.
 */
const removeElement: HTMLRewriterElementContentHandlers = {
	element(el: Element) {
		el.remove();
	},
};

/**
 * Force `noindex` on a page the shell is standing in for.
 *
 * Deliberately a *removal* plus one append rather than an in-place attribute
 * rewrite: the shell may or may not carry a robots tag depending on which route
 * the mask path matched, and "append only if absent" cannot be decided from the
 * `<head>` start tag, which HTMLRewriter reaches before any of its children.
 * Removing every robots tag and appending exactly one is order-independent and
 * cannot produce a second.
 *
 * `noindex, follow`, not `nofollow`: the shell's links out are still worth
 * crawling.
 */
const appendNoindex: HTMLRewriterElementContentHandlers = {
	element(el: Element) {
		el.append(`<meta name="robots" content="noindex, follow" />`, {
			html: true,
		});
	},
};

export async function onRequest(
	context: EventContext<unknown, string, unknown>,
): Promise<Response> {
	const { request, next } = context;
	const url = new URL(request.url);

	const response = await next();

	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("text/html")) return response;

	const nameMatch = url.pathname.match(/^\/name\/([^/]+)$/);
	const speciesMatch = url.pathname.match(/^\/species\/([^/]+)$/);
	const regionMatch = url.pathname.match(/^\/region\/([^/]+)$/);

	let resolved = false;
	try {
		if (nameMatch) resolved = nameMatch[1] in namesById;
		else if (speciesMatch) resolved = speciesMatch[1] in speciesById;
		else if (regionMatch) resolved = regionIds.has(regionMatch[1]);
	} catch (e) {
		console.error("id lookup error:", e);
	}

	/**
	 * A detail page that came back 200 for an id we cannot resolve is a deleted
	 * record still being served from a stale asset — turn it into a real 404.
	 * `tableSize` is 0 for anything that is not one of the three detail routes,
	 * which the guard reads as "do nothing".
	 */
	const tableSize = nameMatch
		? NAME_COUNT
		: speciesMatch
			? SPECIES_COUNT
			: regionMatch
				? REGION_COUNT
				: 0;
	if (shouldServeGone(url.pathname, response.status, resolved, tableSize)) {
		return goneResponse();
	}

	/**
	 * `isIndexable` is exactly the set of paths that have a prerendered file:
	 * the static routes, plus a detail route whose id resolves. Anything it says
	 * yes to already carries its own correct head and must be passed through
	 * untouched — rewriting it is how duplicate tags happen. Anything it says no
	 * to is being answered by the SPA shell.
	 *
	 * Note the direction of the failure: a path shape `isIndexable` does not
	 * recognise gets treated as a dead URL and marked `noindex`. That nearly
	 * deindexed the region pages once, which is why `/region/:id` is in
	 * `DETAIL_ROUTE` there and why a new route must be added to it.
	 */
	if (isIndexable(url.pathname, resolved)) {
		const passthrough = new Response(response.body, response);
		// HTML must revalidate on every visit so users always get the latest
		// asset references after deployments.
		passthrough.headers.set("Cache-Control", HTML_CACHE_CONTROL);
		return passthrough;
	}

	const rewritten = new HTMLRewriter()
		.on('meta[name="robots"]', removeElement)
		.on('link[rel="canonical"]', removeElement)
		.on('script[type="application/ld+json"]', removeElement)
		.on("head", appendNoindex)
		.transform(response);

	const cached = new Response(rewritten.body, rewritten);
	cached.headers.set("Cache-Control", HTML_CACHE_CONTROL);
	return cached;
}
