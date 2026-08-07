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

/**
 * Search-snippet budgets.
 *
 * Google truncates the `<title>` around 60 characters and the description
 * snippet around 155-160. Anything past the cut is invisible in results, so
 * the page-specific text must come FIRST and the brand context last. These are
 * deliberately tighter than the ~500 char budget used for og:/twitter: tags,
 * which are rendered in full by social cards.
 */
export const META_TITLE_MAX = 60;
export const META_DESCRIPTION_MAX = 155;

const TITLE_BRAND = " — LinkedFin";
const DESCRIPTION_BRAND = " | LinkedFin fish name etymology";

/**
 * `<title>` for a resolved detail page: page-specific text first, brand last.
 */
export function buildMetaTitle(core: string): string {
	const text = sanitize(core);
	if (!text) return GENERIC_META.title;
	return `${truncate(text, META_TITLE_MAX - TITLE_BRAND.length)}${TITLE_BRAND}`;
}

/**
 * `<meta name="description">` for a resolved detail page.
 *
 * The distinguishing text (region, language, etymology) leads. The brand tail
 * is only appended when it fits inside the snippet budget — it is the first
 * thing worth losing.
 */
export function buildMetaDescription(core: string, sep = " "): string {
	const text = sanitize(core);
	if (!text) return GENERIC_META.description;
	if (text.length + DESCRIPTION_BRAND.length <= META_DESCRIPTION_MAX) {
		return `${text}${DESCRIPTION_BRAND}`;
	}
	return truncate(text, META_DESCRIPTION_MAX, sep);
}

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
