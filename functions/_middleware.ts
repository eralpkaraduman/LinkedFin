import { namesById, namesBySpeciesId, speciesById } from "./og-data.ts";
import {
	buildNameOg,
	buildSpeciesOg,
	GENERIC_META,
	sanitize,
	truncate,
} from "./og-utils.ts";

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
	) {}

	element(el: Element) {
		const t = escapeHtml(sanitize(this.title));
		const d = escapeHtml(sanitize(this.description));
		const u = escapeHtml(this.url);
		const img = escapeHtml(this.imgUrl);
		el.append(
			`<meta name="robots" content="index, follow" />` +
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

function lookupName(
	nameId: string,
): { title: string; description: string } | null {
	const row = namesById[nameId];
	if (!row) return null;
	const og = buildNameOg(row);
	return {
		title: `LinkedFin: ${og.title}`,
		description: truncate(og.description, 500),
	};
}

function lookupSpecies(
	speciesId: string,
): { title: string; description: string } | null {
	const species = speciesById[speciesId];
	if (!species) return null;

	const names = (namesBySpeciesId[speciesId] ?? []).map((name) => ({ name }));

	const og = buildSpeciesOg(species, names);
	return {
		title: `LinkedFin: ${og.title}`,
		description: truncate(og.description, 500, ", "),
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

	let og: { title: string; description: string } | null = null;
	try {
		if (nameMatch) {
			og = lookupName(nameMatch[1]);
		} else if (speciesMatch) {
			og = lookupSpecies(speciesMatch[1]);
		}
	} catch (e) {
		console.error("OG lookup error:", e);
	}

	if (!og) {
		og = GENERIC_META;
	}

	let imgUrl: string;
	if (nameMatch) {
		imgUrl = `${url.origin}/og/name/${nameMatch[1]}`;
	} else if (speciesMatch) {
		imgUrl = `${url.origin}/og/species/${speciesMatch[1]}`;
	} else {
		imgUrl = `${url.origin}/og/home`;
	}

	const rewritten = new HTMLRewriter()
		.on("head", new OgTagsHandler(og.title, og.description, url.href, imgUrl))
		.transform(response);

	const cached = new Response(rewritten.body, rewritten);
	// HTML must revalidate on every visit so users always get the latest
	// asset references after deployments. CDN (s-maxage) can still cache.
	cached.headers.set(
		"Cache-Control",
		"public, max-age=0, must-revalidate, s-maxage=604800",
	);
	return cached;
}
