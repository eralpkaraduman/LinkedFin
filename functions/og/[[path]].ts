import { ImageResponse } from "workers-og";
import { namesById, namesBySpeciesId, speciesById } from "../og-data.ts";
import {
	buildNameOg,
	buildSpeciesOg,
	GENERIC_OG,
	isArabicLang,
	stripArabic,
	truncate,
} from "../og-utils.ts";

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

/**
 * Strip polytonic Greek combining marks unsupported by Noto Sans monotonic Greek.
 * Targets: smooth/rough breathing (U+0313/0314), perispomeni (U+0342), iota subscript (U+0345).
 */
function stripPolytonicMarks(str: string): string {
	return str
		.normalize("NFD")
		.replace(/[\u0313\u0314\u0342\u0345]/g, "")
		.normalize("NFC");
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

	let title = GENERIC_OG.title;
	let description = GENERIC_OG.description;

	try {
		if (type === "name" && id) {
			const row = namesById[id];
			if (row) {
				const og = buildNameOg(row);
				title =
					isArabicLang(row.lang) && row.transliteration
						? row.transliteration
						: og.title;
				description = og.description;
			}
		} else if (type === "species" && id) {
			const species = speciesById[id];
			if (species) {
				const names = (namesBySpeciesId[id] ?? []).map((name) => ({
					name,
				}));
				const og = buildSpeciesOg(species, names);
				title = og.title;
				description = og.description;
			}
		}
	} catch (e) {
		console.error("OG image lookup error:", e);
	}

	title = escapeImageHtml(
		truncate(stripArabic(stripPolytonicMarks(title)), 60),
	);
	description = escapeImageHtml(
		truncate(stripArabic(stripPolytonicMarks(description)), 120),
	);

	try {
		const fonts = await loadFonts(url.origin);
		return new ImageResponse(buildHtml(title, description), {
			width: 1200,
			height: 630,
			fonts,
			headers: {
				"Cache-Control": "public, max-age=604800, s-maxage=604800",
			},
		});
	} catch (e) {
		console.error("OG image generation error:", e);
		return Response.redirect(`${url.origin}/og-image.png`, 302);
	}
}
