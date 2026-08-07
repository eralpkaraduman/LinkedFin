import data from "./og-data.json";
import {
	buildMetaDescription,
	buildMetaTitle,
	buildNameOg,
	buildSpeciesOg,
	GENERIC_META,
	sanitize,
	truncate,
} from "./og-utils.ts";
import { canonicalUrl, isIndexable } from "./seo-utils.ts";

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
		private canonical: string,
		private indexable: boolean,
	) {}

	element(el: Element) {
		const t = escapeHtml(sanitize(this.title));
		const d = escapeHtml(sanitize(this.description));
		const u = escapeHtml(this.url);
		const img = escapeHtml(this.imgUrl);
		const canonical = escapeHtml(this.canonical);
		el.append(
			`<link rel="canonical" href="${canonical}" />` +
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
				`<meta name="twitter:image" content="${img}" />`,
			{ html: true },
		);
	}
}

/**
 * REPLACES the shell's generic `<title>` instead of appending to it.
 *
 * `setInnerContent` drops every existing text chunk in one go, so there is no
 * boilerplate prefix left for Google to truncate against. `html: false` makes
 * the rewriter escape the text itself — do not pre-escape or it double-encodes
 * the Greek/Arabic/Turkish strings.
 */
class TitleHandler implements HTMLRewriterElementContentHandlers {
	constructor(private title: string) {}

	element(el: Element) {
		el.setInnerContent(sanitize(this.title), { html: false });
	}
}

/** REPLACES the shell's generic description rather than concatenating onto it. */
class MetaDescriptionHandler implements HTMLRewriterElementContentHandlers {
	constructor(private description: string) {}

	element(el: Element) {
		if (el.getAttribute("name") !== "description") return;
		// setAttribute escapes the value; pass the raw sanitized string.
		el.setAttribute("content", sanitize(this.description));
	}
}

interface PageMeta {
	/** og:/twitter: title — rendered in full by social cards, so it can be long. */
	ogTitle: string;
	/** og:/twitter: description — same, budget stays at 500 chars. */
	ogDescription: string;
	/** Replacement for the shell `<title>`, within the SERP budget. */
	metaTitle: string;
	/** Replacement for the shell `<meta name="description">`, within the SERP budget. */
	metaDescription: string;
}

function lookupName(nameId: string): PageMeta | null {
	const row = namesById[nameId];
	if (!row) return null;
	const og = buildNameOg(row);
	return {
		ogTitle: `LinkedFin: ${og.title}`,
		ogDescription: truncate(og.description, 500),
		metaTitle: buildMetaTitle(og.title),
		metaDescription: buildMetaDescription(og.description),
	};
}

function lookupSpecies(speciesId: string): PageMeta | null {
	const species = speciesById[speciesId];
	if (!species) return null;

	const names = (namesBySpeciesId[speciesId] ?? []).map((name) => ({ name }));

	const og = buildSpeciesOg(species, names);
	// buildSpeciesOg falls back to the scientific name when a species has no
	// names yet; don't emit "Cancer pagurus: Cancer pagurus" in that case.
	const descriptionCore =
		og.description === og.title ? og.title : `${og.title}: ${og.description}`;
	return {
		ogTitle: `LinkedFin: ${og.title}`,
		ogDescription: truncate(og.description, 500, ", "),
		metaTitle: buildMetaTitle(og.title),
		metaDescription: buildMetaDescription(descriptionCore, ", "),
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

	const canonical = canonicalUrl(url);
	const indexable = isIndexable(url.pathname, pageMeta !== null);

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
			canonical,
			indexable,
		),
	);

	if (pageMeta) {
		rewriter
			.on("title", new TitleHandler(pageMeta.metaTitle))
			.on("meta", new MetaDescriptionHandler(pageMeta.metaDescription));
	}

	const rewritten = rewriter.transform(response);

	const cached = new Response(rewritten.body, rewritten);
	// HTML must revalidate on every visit so users always get the latest
	// asset references after deployments.
	cached.headers.set("Cache-Control", "public, max-age=0, must-revalidate");
	return cached;
}
