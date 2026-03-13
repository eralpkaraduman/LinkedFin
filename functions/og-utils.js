/**
 * Shared OG title/description construction for middleware and image generation.
 * Both consumers must use these functions to avoid duplication.
 */

const LANG_NAMES = {
	tur: "Turkish",
	ell: "Greek",
	eng: "English",
	arb: "Standard Arabic",
	arz: "Egyptian Arabic",
	apc: "Levantine Arabic",
	fin: "Finnish",
	swe: "Swedish",
	est: "Estonian",
	sme: "Northern Sami",
	grc: "Ancient Greek",
	ita: "Italian",
	fas: "Persian",
	vec: "Venetian",
};

/**
 * Get human-readable language name from ISO 639-3 code.
 * @param {string} code
 * @returns {string}
 */
export function getLangName(code) {
	return LANG_NAMES[code] || code;
}

/**
 * Collapse whitespace and trim.
 * @param {string} str
 * @returns {string}
 */
export function sanitize(str) {
	return String(str || "").replace(/\s+/g, " ").trim();
}

/**
 * Truncate string, breaking at last separator before max.
 * @param {string} str
 * @param {number} max
 * @param {string} [sep=" "]
 * @returns {string}
 */
export function truncate(str, max, sep = " ") {
	if (str.length <= max) return str;
	const cut = str.lastIndexOf(sep, max - 1);
	return `${str.slice(0, cut > 0 ? cut : max)}\u2026`;
}

const ARABIC_LANGS = new Set(["arb", "arz", "apc"]);

/** Check if language code is an Arabic variant */
export function isArabicLang(lang) {
	return ARABIC_LANGS.has(lang);
}


export const GENERIC_OG = {
	title: "LinkedFin",
	description:
		"Explore the origins and meanings of fish names across languages",
};

export const GENERIC_META = {
	title: "LinkedFin - Fish Names Etymology Database",
	description:
		"Explore the origins and meanings of fish names across languages. A comprehensive etymology database linking Mediterranean fish names from Turkish, Greek, Arabic, and more.",
};

/**
 * Build OG title and description for a name record.
 * Used by both middleware (meta tags) and image generation.
 *
 * @param {{ name: string, lang: string, region_name: string, etymology: string|null, transliteration: string|null }} row
 * @returns {{ title: string, description: string }}
 */
export function buildNameOg(row) {
	const title = row.name;
	const prefix = `${getLangName(row.lang)} · ${row.region_name}`;
	const etymology = sanitize(row.etymology);
	const description = etymology ? `${prefix} — ${etymology}` : prefix;
	return { title, description };
}

/**
 * Build OG title and description for a species record.
 *
 * @param {{ scientific_name: string }} species
 * @param {{ name: string }[]} names
 * @returns {{ title: string, description: string }}
 */
export function buildSpeciesOg(species, names) {
	const title = species.scientific_name;
	const nameList = names.map((n) => n.name).join(", ");
	const description = nameList || species.scientific_name;
	return { title, description };
}
