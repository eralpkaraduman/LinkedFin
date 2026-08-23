/**
 * How a record is described. The one definition.
 *
 * ## Why this directory exists
 *
 * A page's title and description used to be written twice: `namePageMeta` in
 * `src/lib/pageData.ts` produced the `<title>` and `<meta description>`, and
 * `buildNameOg` in `functions/og-utils.ts` produced the `og:`/`twitter:` text
 * and the words drawn on the 1200x630 card. The two files cannot see each
 * other, nothing tested them against each other, and they agreed only because
 * each had been edited carefully. That is the same shape as the propagated
 * etymology errors — one fact, several owners, silent drift.
 *
 * `src/shared/` is the answer: modules that both the React app and the
 * Cloudflare Pages Functions import. Pages bundles `functions/` with esbuild,
 * which follows a relative import out of the directory and inlines the result,
 * so this works at runtime. Two rules keep it working:
 *
 * 1. **Relative paths only from `functions/`** (`../src/shared/pageMeta.ts`).
 *    The `#/` alias resolves at bundle time but fails
 *    `tsc -p functions/tsconfig.json` — runtime-works, typecheck-fails, the
 *    worst kind of trap.
 * 2. **This module must stay dependency-free.** No React, no sqlite-wasm, no
 *    Node built-ins, and nothing that reaches `#/lib/fishData`. esbuild follows
 *    every transitive import into the Worker bundle. Type-only imports are
 *    fine; they disappear.
 *
 * (`functions/jsonld.ts` used to assert that `functions/` "must not import
 * across the src boundary". That was a statement about a missing `paths`
 * mapping, not about the bundler. It has been verified false and that file is
 * gone.)
 *
 * ## The unified text
 *
 * The `namePageMeta` style won. `<title>`, `og:title` and `twitter:title` are
 * all the full "Kalamar — Turkish name for Loligo vulgaris | LinkedFin"; the
 * description is the same sentence everywhere. The old OG wording
 * ("LinkedFin: Kalamar", "Turkish · Turkish Aegean — …") was the shorter,
 * card-shaped one, and reproducing it in `src/` would only have moved the
 * duplication rather than removed it.
 *
 * What legitimately differs between a link preview and a rendered card is
 * *length*, not content — 80px type in a 1200x630 box does not hold a 60
 * character title. So the card takes `headline` (the record's own name, no site
 * suffix) and asks for a shorter `descriptionLimit`. One builder, parameters —
 * not two builders.
 */

/** The site's name, as it appears in a title suffix. */
export const SITE_NAME = "LinkedFin";

/**
 * Google cuts a snippet around 155 characters and shows roughly 60 of a title,
 * so both put the page-specific words first. "Kalamar — LinkedFin", never
 * "LinkedFin … | Kalamar", which would bury the one word that distinguishes
 * this page from the other 646. 300 leaves room for the etymology that follows
 * the lead sentence without letting it run away.
 */
export const META_DESCRIPTION_LIMIT = 300;

/**
 * Structured data has no snippet limit of its own; 500 is what the JSON-LD
 * builders have always used and is short enough to stay a description rather
 * than a copy of the page.
 */
export const JSONLD_DESCRIPTION_LIMIT = 500;

/** What fits under the card headline at 36px before satori overflows the box. */
export const CARD_DESCRIPTION_LIMIT = 120;

/** What fits as the card headline at 64–80px. */
export const CARD_TITLE_LIMIT = 60;

/**
 * One record, described.
 *
 * `title` and `description` are what every consumer wants: `<title>`,
 * `<meta name="description">`, `og:title`/`og:description`, the twitter pair,
 * and the JSON-LD `name`/`description`. `headline` exists only because the OG
 * card draws the title at 80px and cannot hold the site suffix.
 */
export interface PageMeta {
	/** Full title, site suffix included. */
	title: string;
	/** The record's own name, no suffix — the OG card's headline. */
	headline: string;
	/** Description, already collapsed and truncated to the requested budget. */
	description: string;
}

export interface MetaOptions {
	/** Character budget for `description`. Defaults to `META_DESCRIPTION_LIMIT`. */
	descriptionLimit?: number;
}

/** Collapse runs of whitespace (including newlines) to single spaces. */
export function sanitize(str: string | null | undefined): string {
	return String(str ?? "")
		.replace(/\s+/g, " ")
		.trim();
}

/** Trim to `max` characters on a word boundary, appending an ellipsis. */
export function truncate(text: string, max: number): string {
	const value = sanitize(text);
	if (value.length <= max) return value;
	const cut = value.lastIndexOf(" ", max - 1);
	return `${value.slice(0, cut > 0 ? cut : max)}…`;
}

/**
 * The site's one-line self-description. Used as the lead of the generic meta
 * description and as the WebSite entity's `description`, which is why it is a
 * constant rather than two similar sentences.
 */
export const SITE_TAGLINE =
	"Explore the origins and meanings of fish names across languages";

/**
 * What a page is called when it describes no particular record: the homepage,
 * `/about`, and the SPA shell that Cloudflare Pages serves for dead URLs.
 */
export const GENERIC_META: PageMeta = {
	title: `${SITE_NAME} - Fish Names Etymology Database`,
	headline: SITE_NAME,
	description: `${SITE_TAGLINE}. A comprehensive etymology database linking Mediterranean fish names from Turkish, Greek, Arabic, and more.`,
};

/**
 * The fields a fish name needs to describe itself.
 *
 * Structurally satisfied by `FishName` (so route loaders pass their rows
 * straight through) and by the rows `og-data-gen.ts` bakes into
 * `functions/og-data.json` (so the OG image endpoint passes its rows straight
 * through). Keeping the two in the same shape is the point: a field added here
 * fails to compile in whichever of the two has not been updated.
 */
export interface NameMetaInput {
	name: string;
	lang: string;
	/** English display name of `lang` — resolved once, at build time. */
	language: string;
	scientific_name: string;
	region: string;
	etymology: string | null;
	transliteration: string | null;
}

export interface SpeciesMetaInput {
	scientificName: string;
	notes: string | null;
	/** Vernacular names, in the order they should be listed. */
	names: readonly string[];
}

export interface RegionMetaInput {
	name: string;
	/** Every name in the region — the count comes from the length. */
	names: readonly string[];
}

export function buildNameMeta(
	row: NameMetaInput,
	{ descriptionLimit = META_DESCRIPTION_LIMIT }: MetaOptions = {},
): PageMeta {
	const etymology = sanitize(row.etymology);
	const lead = `${row.name} is the ${row.language} name for ${row.scientific_name} in ${row.region}.`;
	const transliteration = sanitize(row.transliteration);
	const titleName =
		transliteration && transliteration !== row.name
			? `${row.name} (${transliteration})`
			: row.name;
	return {
		/**
		 * The language is in the title because the name alone is not unique:
		 * Finnish and Estonian both call Perca fluviatilis "Ahven", Norwegian and
		 * Danish both call Clupea harengus "Sild", and six such pairs would
		 * otherwise ship byte-identical titles.
		 *
		 * The transliteration rides along for names in non-Latin script (same
		 * `transliteration !== name` guard as `alternateName` in jsonld.ts) so a
		 * searcher who types the Latin form — "cinekop", "sasan" — has it to
		 * match against, not just the original script.
		 */
		title: `${titleName} — ${row.language} name for ${row.scientific_name} | ${SITE_NAME}`,
		headline: row.name,
		description: truncate(
			etymology ? `${lead} ${etymology}` : lead,
			descriptionLimit,
		),
	};
}

export function buildSpeciesMeta(
	page: SpeciesMetaInput,
	{ descriptionLimit = META_DESCRIPTION_LIMIT }: MetaOptions = {},
): PageMeta {
	const names = page.names.join(", ");
	const lead = names
		? `${page.scientificName} is called ${names}.`
		: `${page.scientificName}.`;
	const notes = sanitize(page.notes);
	return {
		title: `${page.scientificName} — fish names and etymology | ${SITE_NAME}`,
		headline: page.scientificName,
		description: truncate(notes ? `${lead} ${notes}` : lead, descriptionLimit),
	};
}

/**
 * These pages exist to answer "Turkish fish names", "Greek fish names" — so the
 * region leads the title and the words a searcher typed follow immediately.
 */
export function buildRegionMeta(
	page: RegionMetaInput,
	{ descriptionLimit = META_DESCRIPTION_LIMIT }: MetaOptions = {},
): PageMeta {
	const count = page.names.length;
	const lead = `${count} fish ${count === 1 ? "name" : "names"} from ${page.name}, with etymology, transliteration and pronunciation.`;
	return {
		title: `${page.name} — fish names and etymology | ${SITE_NAME}`,
		headline: `${page.name} fish names`,
		description: truncate(`${lead} ${page.names.join(", ")}`, descriptionLimit),
	};
}

/**
 * Path of the OG card for a page.
 *
 * `/region/*` deliberately gets the generic card: a per-region card would say
 * little more than its title already does, and each one is a satori render at
 * the edge. `functions/og/[[path]].ts` renders the generic card for any path it
 * does not recognise, so `/og/home` is not a special endpoint but the
 * deliberate name for that fallback.
 */
export function ogImagePath(pathname: string): string {
	const match = pathname.match(/^\/(name|species)\/([^/]+)$/);
	return match ? `/og/${match[1]}/${match[2]}` : "/og/home";
}
