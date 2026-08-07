/**
 * JSON-LD structured data for the Pages Functions middleware.
 *
 * Kept out of _middleware.ts so the builders are unit-testable — the middleware
 * itself depends on the Workers runtime (HTMLRewriter).
 *
 * Vocabulary (checked against schema.org, not guessed):
 * - `/name/*`   → DefinedTerm inside a site-wide DefinedTermSet. A fish name is
 *                 a term in a controlled vocabulary, not a CreativeWork.
 * - `/species/*`→ Taxon (schema.org's purpose-built type for a taxonomic
 *                 concept; it lives in the "new/pending" area but resolves at
 *                 https://schema.org/Taxon and is what Bioschemas/GBIF emit).
 * - `/`         → WebSite + SearchAction. Google's sitelinks-searchbox docs say
 *                 to put this on the homepage only, so that is where it goes.
 *
 * No Wikidata `sameAs` in v1: QIDs are resolved in the browser at runtime, so
 * they do not exist at the edge.
 */

import { buildNameOg, type NameRow, sanitize, truncate } from "./og-utils.ts";

/**
 * Canonical origin. Duplicated from src/lib/site.ts on purpose: `functions/`
 * has its own tsconfig and is bundled separately, so it must not import across
 * the src boundary. Structured-data `@id`/`url` values have to match the
 * canonical URLs the routes emit, which are built from the same origin.
 */
export const SITE_ORIGIN = "https://linkedfin.net";

/**
 * ISO 639-3 → ISO 639-1, mirroring `toBcp47` in src/lib/language.ts (same
 * reason as SITE_ORIGIN — no cross-boundary import). `inLanguage` wants BCP 47,
 * which prefers the shortest tag, so `tur` becomes `tr`; codes with no
 * two-letter form (grc, arz, apc, vec) are already valid BCP 47 and pass
 * through.
 */
const ISO_639_3_TO_1: Record<string, string> = {
	arb: "ar",
	dan: "da",
	deu: "de",
	ell: "el",
	eng: "en",
	est: "et",
	fas: "fa",
	fin: "fi",
	fra: "fr",
	ita: "it",
	nld: "nl",
	nor: "no",
	pol: "pl",
	sme: "se",
	spa: "es",
	swe: "sv",
	tur: "tr",
};

export function toBcp47(lang: string | null | undefined): string | undefined {
	if (!lang) return undefined;
	const normalized = lang.trim().toLowerCase();
	if (!normalized) return undefined;
	return ISO_639_3_TO_1[normalized] ?? normalized;
}

/** The one term set every fish name belongs to. */
const TERM_SET_ID = `${SITE_ORIGIN}/#fish-names`;

export interface SpeciesTaxonInput {
	scientific_name: string;
}

type JsonLd = Record<string, unknown>;

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
 */
export function serializeJsonLd(value: JsonLd): string {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/>/g, "\\u003e")
		.replace(/&/g, "\\u0026")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029");
}

/** Wrap serialized JSON-LD in the script tag the middleware appends to `<head>`. */
export function jsonLdScript(value: JsonLd | null): string {
	if (!value) return "";
	return `<script type="application/ld+json">${serializeJsonLd(value)}</script>`;
}

/**
 * A fish name as a DefinedTerm.
 *
 * `inLanguage` is requested by the spec and is what consumers look for; note it
 * is not in schema.org's declared domain for DefinedTerm (that is CreativeWork
 * and friends). It is carried on the enclosing DefinedTermSet as well, where it
 * is unambiguously in-domain, so a strict consumer still learns the language.
 */
export function buildNameJsonLd(id: string, row: NameRow): JsonLd {
	const url = `${SITE_ORIGIN}/name/${id}`;
	const og = buildNameOg(row);
	const language = toBcp47(row.lang);
	const transliteration = sanitize(row.transliteration);

	const term: JsonLd = {
		"@context": "https://schema.org",
		"@type": "DefinedTerm",
		"@id": `${url}#term`,
		url,
		name: sanitize(row.name),
		termCode: id,
		description: truncate(sanitize(og.description), 500),
		inDefinedTermSet: {
			"@type": "DefinedTermSet",
			"@id": TERM_SET_ID,
			name: "LinkedFin fish names",
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
	species: SpeciesTaxonInput,
	names: string[],
): JsonLd {
	const url = `${SITE_ORIGIN}/species/${id}`;
	const alternateName = [
		...new Set(names.map((n) => sanitize(n)).filter(Boolean)),
	];

	const taxon: JsonLd = {
		"@context": "https://schema.org",
		"@type": "Taxon",
		"@id": `${url}#taxon`,
		url,
		name: sanitize(species.scientific_name),
		taxonRank: "species",
	};

	if (alternateName.length > 0) taxon.alternateName = alternateName;

	return taxon;
}

/**
 * The site itself, with the search box on the homepage (`/?q=…`).
 *
 * Google's sitelinks-searchbox documentation is explicit that this belongs on
 * the homepage only, so the middleware emits it for `/` and nowhere else.
 */
export function buildWebSiteJsonLd(): JsonLd {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		"@id": `${SITE_ORIGIN}/#website`,
		url: `${SITE_ORIGIN}/`,
		name: "LinkedFin",
		description:
			"Explore the origins and meanings of fish names across languages",
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
