import { ImageResponse } from "workers-og";
import {
	buildNameMeta,
	buildSpeciesMeta,
	CARD_DESCRIPTION_LIMIT,
	CARD_TITLE_LIMIT,
	GENERIC_META,
	truncate,
} from "../../src/shared/pageMeta.ts";
import data from "../og-data.json";
import {
	hasArabicScript,
	stripArabic,
	stripPolytonicMarks,
} from "../og-utils.ts";

/**
 * The card's words come from the same builders as the page's `<title>`,
 * `og:title` and JSON-LD — `src/shared/pageMeta.ts`, imported with a relative
 * path because the `#/` alias does not survive `tsc -p functions/tsconfig.json`.
 *
 * What the card takes differently is *length*, not content: `headline` is the
 * record's own name without the "| LinkedFin" suffix (80px type in a 1200x630
 * box cannot hold the full title) and the description is asked for at
 * `CARD_DESCRIPTION_LIMIT` instead of the 300 a search snippet gets.
 */
const namesById = data.namesById as Record<
	string,
	(typeof data.namesById)[keyof typeof data.namesById]
>;
const speciesById = data.speciesById as Record<
	string,
	(typeof data.speciesById)[keyof typeof data.speciesById]
>;
const namesBySpeciesId = data.namesBySpeciesId as Record<string, string[]>;

const fontCache: Record<string, ArrayBuffer> = {};

async function loadFont(key: string, url: string): Promise<ArrayBuffer> {
	if (fontCache[key]) return fontCache[key];
	const res = await fetch(url);
	fontCache[key] = await res.arrayBuffer();
	return fontCache[key];
}

async function loadFonts(
	origin: string,
): Promise<
	{ name: string; data: ArrayBuffer; weight: number; style: string }[]
> {
	const data = await loadFont("noto", `${origin}/fonts/noto-sans-bold.woff`);
	return [{ name: "Noto Sans", data, weight: 700, style: "normal" }];
}

function buildHtml(title: string, description: string): string {
	const titleSize = title.length > 30 ? "64px" : "80px";
	const descHtml = description
		? `<div style="display:flex;font-size:36px;line-height:1.4;color:#94a3b8">${description}</div>`
		: "";

	return [
		`<div style="display:flex;flex-direction:column;justify-content:center;gap:24px;width:1200px;height:630px;background:#0f172a;padding:32px 120px;font-family:'Noto Sans';color:#f8fafc">`,
		`<div style="display:flex;align-items:center;font-size:32px">`,
		`<span style="color:#f8fafc;font-weight:700;margin-right:4px">Linked</span>`,
		`<span style="background:#0891B2;color:#fff;padding:2px 8px;border-radius:6px;font-weight:700">Fin</span>`,
		`</div>`,
		`<div style="display:flex;flex-direction:column;gap:16px">`,
		`<div style="display:flex;font-size:${titleSize};font-weight:700;line-height:1.15;color:#f8fafc">${title}</div>`,
		descHtml,
		`</div>`,
		`<div style="display:flex;font-size:28px;color:#475569">Fish name etymology database</div>`,
		`</div>`,
	].join("");
}

function escapeImageHtml(str: string): string {
	return str.replace(/↳/g, "—").replace(/&/g, "&amp;").replace(/</g, "&lt;");
}

export async function onRequest(
	context: EventContext<unknown, string, unknown>,
): Promise<Response> {
	const { params } = context;
	const url = new URL(context.request.url);

	const parts = ((params as { path?: string[] }).path || []).filter(Boolean);
	const [type, id] = parts;

	let title = GENERIC_META.headline;
	let description = GENERIC_META.description;

	try {
		if (type === "name" && id) {
			const row = namesById[id];
			if (row) {
				// The card is the one place an Arabic-script name cannot be drawn as
				// itself — satori has no RTL shaping — so headline and description
				// use the transliteration. Every text consumer keeps the original.
				const card =
					hasArabicScript(row.name) && row.transliteration
						? { ...row, name: row.transliteration }
						: row;
				const meta = buildNameMeta(card, {
					descriptionLimit: CARD_DESCRIPTION_LIMIT,
				});
				title = meta.headline;
				description = meta.description;
			}
		} else if (type === "species" && id) {
			const species = speciesById[id];
			if (species) {
				const meta = buildSpeciesMeta(
					{ ...species, names: namesBySpeciesId[id] ?? [] },
					{ descriptionLimit: CARD_DESCRIPTION_LIMIT },
				);
				title = meta.headline;
				description = meta.description;
			}
		}
	} catch (e) {
		console.error("OG image lookup error:", e);
	}

	title = escapeImageHtml(
		truncate(stripArabic(stripPolytonicMarks(title)), CARD_TITLE_LIMIT),
	);
	description = escapeImageHtml(
		truncate(
			stripArabic(stripPolytonicMarks(description)),
			CARD_DESCRIPTION_LIMIT,
		),
	);

	try {
		const fonts = await loadFonts(url.origin);
		const imgResponse = new ImageResponse(buildHtml(title, description), {
			width: 1200,
			height: 630,
			fonts,
		});
		// Buffer the image so we can set Content-Length — Twitter requires it
		const body = await imgResponse.arrayBuffer();
		return new Response(body, {
			headers: {
				"Content-Type": "image/png",
				"Content-Length": String(body.byteLength),
				"Cache-Control": "public, max-age=604800, s-maxage=604800",
			},
		});
	} catch (e) {
		console.error("OG image generation error:", e);
		return Response.redirect(`${url.origin}/og-image.png`, 302);
	}
}
