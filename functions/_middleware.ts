import {
	buildNameJsonLd,
	buildRegionJsonLd,
	buildSpeciesJsonLd,
	buildWebSiteJsonLd,
	jsonLdScript,
} from "./jsonld.ts";
import data from "./og-data.json";
import {
	buildNameOg,
	buildRegionOg,
	buildSpeciesOg,
	GENERIC_META,
	sanitize,
	truncate,
} from "./og-utils.ts";
import { isIndexable, normalizePath, shouldServeGone } from "./seo-utils.ts";

const namesById = data.namesById as Record<
	string,
	(typeof data.namesById)[keyof typeof data.namesById]
>;
const speciesById = data.speciesById as Record<
	string,
	(typeof data.speciesById)[keyof typeof data.speciesById]
>;
const namesBySpeciesId = data.namesBySpeciesId as Record<string, string[]>;
const regionsById = data.regionsById as Record<
	string,
	(typeof data.regionsById)[keyof typeof data.regionsById]
>;

/**
 * Sizes of the lookup tables, measured once at module init rather than per
 * request — `Object.keys()` on 512 names is not something to do on every hit.
 * These feed the guard in `shouldServeGone`; see that function for why an empty
 * table must never be treated as "nothing exists".
 */
const NAME_COUNT = Object.keys(namesById).length;
const SPECIES_COUNT = Object.keys(speciesById).length;
const REGION_COUNT = Object.keys(regionsById).length;

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

function escapeHtml(str: string): string {
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

class OgTagsHandler implements HTMLRewriterElementContentHandlers {
	constructor(
		private title: string,
		private description: string,
		private url: string,
		private imgUrl: string,
		private indexable: boolean,
		/** Pre-serialized `<script type="application/ld+json">`, or "" for none. */
		private jsonLd: string,
	) {}

	element(el: Element) {
		const t = escapeHtml(sanitize(this.title));
		const d = escapeHtml(sanitize(this.description));
		const u = escapeHtml(this.url);
		const img = escapeHtml(this.imgUrl);
		el.append(
			`<meta name="robots" content="${
				this.indexable ? "index, follow" : "noindex, follow"
			}" />` +
				`<meta property="og:type" content="website" />` +
				`<meta property="og:url" content="${u}" />` +
				`<meta property="og:title" content="${t}" />` +
				`<meta property="og:description" content="${d}" />` +
				`<meta property="og:image" content="${img}" />` +
				`<meta property="og:image:width" content="1200" />` +
				`<meta property="og:image:height" content="630" />` +
				`<meta property="og:image:type" content="image/png" />` +
				`<meta name="twitter:card" content="summary_large_image" />` +
				`<meta name="twitter:title" content="${t}" />` +
				`<meta name="twitter:description" content="${d}" />` +
				`<meta name="twitter:image" content="${img}" />` +
				this.jsonLd,
			{ html: true },
		);
	}
}

/**
 * The `<title>`, `<meta name="description">` and canonical are NOT set here.
 * Every route emits its own via `head()` (src/routes/*), which is rendered
 * into the prerendered HTML and re-applied on hydration — so it is correct for
 * crawlers that run JavaScript and those that don't. Rewriting them here too
 * would give each page two sources for the same tag.
 *
 * What remains middleware-only is the OG/Twitter block (it feeds the OG image
 * endpoint and is not emitted by the app) and the robots directive.
 */
interface PageMeta {
	/** og:/twitter: title — rendered in full by social cards, so it can be long. */
	ogTitle: string;
	/** og:/twitter: description — same, budget stays at 500 chars. */
	ogDescription: string;
	/**
	 * The page's structured data, already serialized into a script tag. Only
	 * pages whose id resolves get one — an unknown id is a real 404 and must not
	 * describe an entity that does not exist.
	 */
	jsonLd: string;
}

function lookupName(nameId: string): PageMeta | null {
	const row = namesById[nameId];
	if (!row) return null;
	const og = buildNameOg(row);
	return {
		ogTitle: `LinkedFin: ${og.title}`,
		ogDescription: truncate(og.description, 500),
		jsonLd: jsonLdScript(buildNameJsonLd(nameId, row)),
	};
}

function lookupSpecies(speciesId: string): PageMeta | null {
	const species = speciesById[speciesId];
	if (!species) return null;

	const nameList = namesBySpeciesId[speciesId] ?? [];
	const names = nameList.map((name) => ({ name }));

	const og = buildSpeciesOg(species, names);
	return {
		ogTitle: `LinkedFin: ${og.title}`,
		ogDescription: truncate(og.description, 500, ", "),
		jsonLd: jsonLdScript(buildSpeciesJsonLd(speciesId, species, nameList)),
	};
}

function lookupRegion(regionId: string): PageMeta | null {
	const row = regionsById[regionId];
	if (!row) return null;

	const og = buildRegionOg(row);
	return {
		ogTitle: `LinkedFin: ${og.title}`,
		ogDescription: truncate(og.description, 500),
		jsonLd: jsonLdScript(buildRegionJsonLd(regionId, row)),
	};
}

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

	let pageMeta: PageMeta | null = null;
	try {
		if (nameMatch) {
			pageMeta = lookupName(nameMatch[1]);
		} else if (speciesMatch) {
			pageMeta = lookupSpecies(speciesMatch[1]);
		} else if (regionMatch) {
			pageMeta = lookupRegion(regionMatch[1]);
		}
	} catch (e) {
		console.error("OG lookup error:", e);
	}

	/**
	 * A detail page that came back 200 for an id we cannot resolve is a deleted
	 * record still being served from a stale asset — turn it into a real 404
	 * before spending any work on meta for a page we are about to discard.
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
	if (
		shouldServeGone(url.pathname, response.status, pageMeta !== null, tableSize)
	) {
		return goneResponse();
	}

	const ogTitle = pageMeta?.ogTitle ?? GENERIC_META.title;
	const ogDescription = pageMeta?.ogDescription ?? GENERIC_META.description;

	const indexable = isIndexable(url.pathname, pageMeta !== null);

	// WebSite/SearchAction goes on the homepage only — Google's sitelinks
	// searchbox docs are explicit about that, and repeating it on every page
	// would just duplicate the same entity.
	const isHome = normalizePath(url.pathname) === "/";
	const jsonLd = isHome
		? jsonLdScript(buildWebSiteJsonLd())
		: (pageMeta?.jsonLd ?? "");

	let imgUrl: string;
	if (nameMatch) {
		imgUrl = `${url.origin}/og/name/${nameMatch[1]}`;
	} else if (speciesMatch) {
		imgUrl = `${url.origin}/og/species/${speciesMatch[1]}`;
	} else {
		/**
		 * Everything else — including `/region/*` — gets the generic card.
		 * `functions/og/[[path]].ts` renders `GENERIC_OG` for any path it does not
		 * recognise, so `/og/home` is not a special endpoint but the deliberate
		 * name for that fallback. A per-region card would say little more than the
		 * title already does, and each one is a satori render at the edge.
		 */
		imgUrl = `${url.origin}/og/home`;
	}

	const rewriter = new HTMLRewriter().on(
		"head",
		new OgTagsHandler(
			ogTitle,
			ogDescription,
			url.href,
			imgUrl,
			indexable,
			jsonLd,
		),
	);

	const rewritten = rewriter.transform(response);

	const cached = new Response(rewritten.body, rewritten);
	// HTML must revalidate on every visit so users always get the latest
	// asset references after deployments.
	cached.headers.set("Cache-Control", HTML_CACHE_CONTROL);
	return cached;
}
