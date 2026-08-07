import {
	buildNameJsonLd,
	buildSpeciesJsonLd,
	buildWebSiteJsonLd,
	jsonLdScript,
} from "./jsonld.ts";
import data from "./og-data.json";
import {
	buildNameOg,
	buildSpeciesOg,
	GENERIC_META,
	sanitize,
	truncate,
} from "./og-utils.ts";
import { isIndexable, normalizePath } from "./seo-utils.ts";

const namesById = data.namesById as Record<
	string,
	(typeof data.namesById)[keyof typeof data.namesById]
>;
const speciesById = data.speciesById as Record<
	string,
	(typeof data.speciesById)[keyof typeof data.speciesById]
>;
const namesBySpeciesId = data.namesBySpeciesId as Record<string, string[]>;

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

	let pageMeta: PageMeta | null = null;
	try {
		if (nameMatch) {
			pageMeta = lookupName(nameMatch[1]);
		} else if (speciesMatch) {
			pageMeta = lookupSpecies(speciesMatch[1]);
		}
	} catch (e) {
		console.error("OG lookup error:", e);
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
	cached.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
	return cached;
}
