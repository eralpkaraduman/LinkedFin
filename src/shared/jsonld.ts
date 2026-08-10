/**
 * JSON-LD structured data.
 *
 * Emitted from each route's `head()` and therefore baked into the prerendered
 * HTML, which is what a crawler fetches. It used to be injected per request by
 * `functions/_middleware.ts` with HTMLRewriter; that was the only way to reach
 * the served document before the pages were prerendered, and it is no longer
 * true.
 *
 * The `name`/`description` values come from `pageMeta.ts` rather than being
 * written again here — a structured-data description that disagreed with the
 * `<meta>` description on the same page is exactly the drift this refactor is
 * about.
 *
 * Vocabulary (checked against schema.org, not guessed):
 * - `/name/*`   → DefinedTerm inside a site-wide DefinedTermSet. A fish name is
 *                 a term in a controlled vocabulary, not a CreativeWork.
 * - `/species/*`→ Taxon (schema.org's purpose-built type for a taxonomic
 *                 concept; it lives in the "new/pending" area but resolves at
 *                 https://schema.org/Taxon and is what Bioschemas/GBIF emit).
 * - `/region/*` → CollectionPage. The page is a listing of other pages, not an
 *                 entity in its own right; `DefinedTermSet` was the alternative
 *                 but the site already declares exactly one of those (all fish
 *                 names), and a region is a subset of it, not a second set.
 * - `/`         → WebSite + SearchAction. Google's sitelinks-searchbox docs say
 *                 to put this on the homepage only, so that is where it goes.
 *
 * No Wikidata `sameAs` in v1: QIDs are resolved in the browser at runtime, so
 * they do not exist at prerender time.
 */

import { toBcp47 } from "./language.ts";
import {
	buildNameMeta,
	buildRegionMeta,
	JSONLD_DESCRIPTION_LIMIT,
	type NameMetaInput,
	type RegionMetaInput,
	SITE_NAME,
	SITE_TAGLINE,
	type SpeciesMetaInput,
	sanitize,
} from "./pageMeta.ts";
import { SITE_ORIGIN } from "./site.ts";

/** The one term set every fish name belongs to. */
const TERM_SET_ID = `${SITE_ORIGIN}/#fish-names`;

export type JsonLd = Record<string, unknown>;

const DESCRIPTION_OPTIONS = { descriptionLimit: JSONLD_DESCRIPTION_LIMIT };

/**
 * Serialize a JSON-LD object for embedding in `<script type="application/ld+json">`.
 *
 * `JSON.stringify` already escapes quotes, backslashes and control characters,
 * and emits the Greek/Arabic/Turkish characters, `·`, `—`, `↳` and apostrophes
 * in the data as-is (valid UTF-8, valid JSON).
 *
 * What it does NOT handle is HTML context: a literal `</script>` inside any
 * string would close the tag early and dump the rest of the payload into the
 * document. `<`, `>` and `&` are therefore re-encoded as `\uXXXX` escapes.
 * That is safe to do over the whole serialized string because JSON's own
 * syntax characters are only `{}[]",:` and whitespace — a `<`, `>` or `&` can
 * only ever occur inside a string literal. The escapes are ordinary JSON, so
 * `JSON.parse` returns the original characters.
 *
 * U+2028/U+2029 are escaped too: legal in JSON, but they terminate a line in
 * JavaScript, so any consumer that evals the block would break on them.
 *
 * This is why the routes do NOT use TanStack Router's built-in
 * `{ "script:ld+json": … }` meta entry: that path runs the payload through an
 * HTML-attribute escaper, which turns every `"` into `&quot;` inside a
 * `<script>` body — where nothing decodes entities — and the block stops being
 * parseable JSON.
 */
export function serializeJsonLd(value: JsonLd): string {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/&/g, "\\u0026")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

/**
 * A fish name as a DefinedTerm.
 *
 * `inLanguage` is requested by the spec and is what consumers look for; note it
 * is not in schema.org's declared domain for DefinedTerm (that is CreativeWork
 * and friends). It is carried on the enclosing DefinedTermSet as well, where it
 * is unambiguously in-domain, so a strict consumer still learns the language.
 */
export function buildNameJsonLd(id: string, row: NameMetaInput): JsonLd {
	const url = `${SITE_ORIGIN}/name/${id}`;
	const meta = buildNameMeta(row, DESCRIPTION_OPTIONS);
	const language = toBcp47(row.lang);
	const transliteration = sanitize(row.transliteration);

	const term: JsonLd = {
		"@context": "https://schema.org",
		"@type": "DefinedTerm",
		"@id": `${url}#term`,
		url,
		name: sanitize(row.name),
		termCode: id,
		description: meta.description,
		inDefinedTermSet: {
			"@type": "DefinedTermSet",
			"@id": TERM_SET_ID,
			name: `${SITE_NAME} fish names`,
			url: `${SITE_ORIGIN}/`,
			...(language ? { inLanguage: language } : {}),
		},
	};

	if (language) term.inLanguage = language;
	if (transliteration && transliteration !== row.name) {
		term.alternateName = transliteration;
	}

	return term;
}

/**
 * A species as a Taxon.
 *
 * `name` is the scientific name (what a Taxon is identified by) and the
 * vernacular names become `alternateName`. `taxonRank` is a plain "species" —
 * schema.org prefers a controlled-vocabulary URI, but the database records no
 * rank beyond binomial species, so the literal is the honest value.
 */
export function buildSpeciesJsonLd(
	id: string,
	species: SpeciesMetaInput,
): JsonLd {
	const url = `${SITE_ORIGIN}/species/${id}`;
	const alternateName = [
		...new Set(species.names.map((n) => sanitize(n)).filter(Boolean)),
	];

	const taxon: JsonLd = {
		"@context": "https://schema.org",
		"@type": "Taxon",
		"@id": `${url}#taxon`,
		url,
		name: sanitize(species.scientificName),
		taxonRank: "species",
	};

	if (alternateName.length > 0) taxon.alternateName = alternateName;

	return taxon;
}

/**
 * A region's listing page as a CollectionPage.
 *
 * `isPartOf` points at the site's WebSite node (`@id` only — the node itself is
 * declared on the homepage) and `mainEntity` at the one DefinedTermSet the
 * `/name/*` pages already put their terms in, which is what ties a region's
 * listing to the vocabulary it draws from.
 */
export function buildRegionJsonLd(id: string, page: RegionMetaInput): JsonLd {
	const url = `${SITE_ORIGIN}/region/${id}`;
	const meta = buildRegionMeta(page, DESCRIPTION_OPTIONS);

	return {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		"@id": `${url}#collection`,
		url,
		name: meta.headline,
		description: meta.description,
		isPartOf: { "@type": "WebSite", "@id": `${SITE_ORIGIN}/#website` },
		mainEntity: {
			"@type": "DefinedTermSet",
			"@id": TERM_SET_ID,
			name: `${SITE_NAME} fish names`,
			url: `${SITE_ORIGIN}/`,
		},
	};
}

/**
 * The site itself, with the search box on the homepage (`/?q=…`).
 *
 * Google's sitelinks-searchbox documentation is explicit that this belongs on
 * the homepage only, so `src/routes/index.tsx` emits it and nothing else does.
 */
export function buildWebSiteJsonLd(): JsonLd {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": `${SITE_ORIGIN}/#website`,
		url: `${SITE_ORIGIN}/`,
		name: SITE_NAME,
		description: SITE_TAGLINE,
		inLanguage: "en",
		potentialAction: {
			"@type": "SearchAction",
			target: {
				"@type": "EntryPoint",
				urlTemplate: `${SITE_ORIGIN}/?q={search_term_string}`,
			},
			"query-input": "required name=search_term_string",
		},
	};
}
