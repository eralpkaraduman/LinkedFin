/**
 * Shared OG title/description construction for middleware and image generation.
 * Both consumers must use these functions to avoid duplication.
 */

const LANG_NAMES: Record<string, string> = {
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

export function getLangName(code: string): string {
	return LANG_NAMES[code] || code;
}

export function sanitize(str: string | null | undefined): string {
	return String(str || "")
		.replace(/\s+/g, " ")
		.trim();
}

export function truncate(str: string, max: number, sep = " "): string {
	if (str.length <= max) return str;
	const cut = str.lastIndexOf(sep, max - 1);
	return `${str.slice(0, cut > 0 ? cut : max)}\u2026`;
}

const ARABIC_LANGS = new Set(["arb", "arz", "apc"]);

export function isArabicLang(lang: string): boolean {
	return ARABIC_LANGS.has(lang);
}

/**
 * Replace Arabic script words with … — satori cannot render RTL/Arabic shaping.
 * Transliterations are already inline so meaning is preserved.
 */
export function stripArabic(str: string): string {
	return str
		.replace(
			/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]+/g,
			"\u2026",
		)
		.replace(/\s*\u2026\s*/g, " \u2026 ")
		.replace(/ {2,}/g, " ")
		.trim();
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

export interface NameRow {
	name: string;
	lang: string;
	region_name: string;
	etymology: string | null;
	transliteration: string | null;
}

export interface SpeciesRow {
	scientific_name: string;
}

export interface NameEntry {
	name: string;
}

export interface RegionRow {
	name: string;
	name_count: number;
}

export function buildRegionOg(row: RegionRow): {
	title: string;
	description: string;
} {
	const count = row.name_count;
	return {
		title: `${row.name} fish names`,
		description: `${count} fish ${count === 1 ? "name" : "names"} from ${row.name}, with etymology, transliteration and pronunciation`,
	};
}

export function buildNameOg(row: NameRow): {
	title: string;
	description: string;
} {
	const title = row.name;
	const prefix = `${getLangName(row.lang)} · ${row.region_name}`;
	const etymology = sanitize(row.etymology);
	const description = etymology ? `${prefix} — ${etymology}` : prefix;
	return { title, description };
}

export function buildSpeciesOg(
	species: SpeciesRow,
	names: NameEntry[],
): { title: string; description: string } {
	const title = species.scientific_name;
	const nameList = names.map((n) => n.name).join(", ");
	const description = nameList || species.scientific_name;
	return { title, description };
}
