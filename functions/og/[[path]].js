import { ImageResponse } from "workers-og";
import {
	GENERIC_OG,
	buildNameOg,
	buildSpeciesOg,
	isArabicLang,
	stripArabic,
	truncate,
} from "../og-utils.js";

const fontCache = {};

async function loadFont(key, url) {
	if (fontCache[key]) return fontCache[key];
	const res = await fetch(url);
	fontCache[key] = await res.arrayBuffer();
	return fontCache[key];
}

const FONTS = [
	{ key: "latin", file: "noto-sans-latin-700.woff" },
	{ key: "greek", file: "noto-sans-greek-700.woff" },
	{ key: "cyrillic", file: "noto-sans-cyrillic-700.woff" },
	{ key: "latin-ext", file: "noto-sans-latin-ext-700.woff" },
];

async function loadFonts(origin) {
	const results = await Promise.allSettled(
		FONTS.map((f) => loadFont(f.key, `${origin}/fonts/${f.file}`)),
	);
	return results
		.map((r, i) =>
			r.status === "fulfilled"
				? { name: "Noto Sans", data: r.value, weight: 700, style: "normal" }
				: null,
		)
		.filter(Boolean);
}

function buildHtml(title, description) {
	const titleSize = title.length > 30 ? "64px" : "80px";
	const descHtml = description
		? `<div style="display:flex;font-size:36px;line-height:1.4;color:#94a3b8">${description}</div>`
		: "";

	return [
		`<div style="display:flex;flex-direction:column;justify-content:center;gap:24px;width:1200px;height:630px;background:#0f172a;padding:32px 40px;font-family:'Noto Sans';color:#f8fafc">`,
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
 * Strip polytonic-only combining marks that Noto Sans Greek (monotonic) can't render.
 * Keeps monotonic tonos (U+0301) and diaeresis (U+0308) which the font supports.
 * Targets: smooth/rough breathing (U+0313/0314), perispomeni (U+0342), iota subscript (U+0345).
 */
function stripPolytonicMarks(str) {
	return str
		.normalize("NFD")
		.replace(/[\u0313\u0314\u0342\u0345]/g, "")
		.normalize("NFC");
}

function escapeImageHtml(str) {
	return str
		.replace(/↳/g, "—")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;");
}

export async function onRequest(context) {
	const { env, params } = context;
	const url = new URL(context.request.url);

	const parts = (params.path || []).filter(Boolean);
	const [type, id] = parts;

	let title = GENERIC_OG.title;
	let description = GENERIC_OG.description;

	try {
		if (type === "name" && id) {
			const row = await env.DB.prepare(
				"SELECT n.name, n.lang, n.etymology, n.transliteration, r.name as region_name FROM names n JOIN regions r ON n.region_id = r.id WHERE n.id = ? LIMIT 1",
			)
				.bind(id)
				.first();
			if (row) {
				const og = buildNameOg(row);
				title = isArabicLang(row.lang) && row.transliteration
					? row.transliteration
					: og.title;
				description = og.description;
			}
		} else if (type === "species" && id) {
			const species = await env.DB.prepare(
				"SELECT scientific_name FROM species WHERE id = ? LIMIT 1",
			)
				.bind(id)
				.first();
			if (species) {
				const { results: names } = await env.DB.prepare(
					"SELECT name FROM names WHERE species_id = ? ORDER BY id",
				)
					.bind(id)
					.all();
				const og = buildSpeciesOg(species, names);
				title = og.title;
				description = og.description;
			}
		}
	} catch (e) {
		console.error("OG image DB lookup error:", e);
	}

	// Strip polytonic marks (unsupported by font), truncate, and escape
	title = escapeImageHtml(truncate(stripArabic(stripPolytonicMarks(title)), 60));
	description = escapeImageHtml(truncate(stripArabic(stripPolytonicMarks(description)), 120));

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
