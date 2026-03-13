import { ImageResponse } from "workers-og";
import {
	GENERIC_OG,
	buildNameOg,
	buildSpeciesOg,
	truncate,
} from "../og-utils.js";

const fontCache = {};

async function loadFont(key, url) {
	if (fontCache[key]) return fontCache[key];
	const res = await fetch(url);
	fontCache[key] = await res.arrayBuffer();
	return fontCache[key];
}

const NPM_BASE = "https://cdn.jsdelivr.net/npm";
const FONTS = [
	{
		key: "latin",
		name: "Noto Sans",
		url: `${NPM_BASE}/@fontsource/noto-sans@latest/files/noto-sans-latin-700-normal.woff`,
	},
	{
		key: "greek",
		name: "Noto Greek",
		url: `${NPM_BASE}/@fontsource/noto-sans@latest/files/noto-sans-greek-700-normal.woff`,
	},
	{
		key: "cyrillic",
		name: "Noto Cyrillic",
		url: `${NPM_BASE}/@fontsource/noto-sans@latest/files/noto-sans-cyrillic-700-normal.woff`,
	},
	{
		key: "turkish",
		name: "Noto Turkish",
		url: `${NPM_BASE}/@fontsource/noto-sans@latest/files/noto-sans-latin-ext-700-normal.woff`,
	},
];

async function loadFonts() {
	const results = await Promise.allSettled(
		FONTS.map((f) => loadFont(f.key, f.url)),
	);
	return results
		.map((r, i) =>
			r.status === "fulfilled"
				? { name: FONTS[i].name, data: r.value, weight: 700, style: "normal" }
				: null,
		)
		.filter(Boolean);
}

function buildHtml(title, description) {
	const titleSize = title.length > 30 ? "52px" : "64px";
	const descHtml = description
		? `<div style="display:flex;font-size:28px;line-height:1.5;color:#94a3b8">${description}</div>`
		: "";

	return [
		`<div style="display:flex;flex-direction:column;justify-content:center;width:1200px;height:630px;background:#0f172a;padding:60px 80px;font-family:Noto Sans, Noto Greek, Noto Cyrillic, Noto Turkish;color:#f8fafc">`,
		`<div style="display:flex;align-items:center;font-size:28px;margin-bottom:40px">`,
		`<span style="color:#f8fafc;font-weight:700;margin-right:4px">Linked</span>`,
		`<span style="background:#0A66C2;color:#fff;padding:2px 8px;border-radius:6px;font-weight:700">Fin</span>`,
		`</div>`,
		`<div style="display:flex;font-size:${titleSize};font-weight:700;line-height:1.2;color:#f8fafc;margin-bottom:20px">${title}</div>`,
		descHtml,
		`<div style="display:flex;font-size:22px;color:#475569;margin-top:40px">Fish name etymology database</div>`,
		`</div>`,
	].join("");
}

function escapeImageHtml(str) {
	return str.replace(/&/g, "&amp;").replace(/</g, "&lt;");
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
				title = og.title;
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

	// Truncate and escape for image HTML
	title = escapeImageHtml(truncate(title, 60));
	description = escapeImageHtml(truncate(description, 120));

	try {
		const fonts = await loadFonts();
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
