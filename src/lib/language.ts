/**
 * Language tag helpers.
 *
 * `names.lang` stores ISO 639-3 codes (validated by
 * maintenance/scripts/validate-integrity.ts). HTML `lang` attributes want
 * BCP 47, which prefers the shortest available tag — so `tur` must be emitted
 * as `tr`, while `grc` (Ancient Greek) has no two-letter form and stays as is.
 */

/** ISO 639-3 → ISO 639-1, for the codes that have a two-letter form. */
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

/**
 * Convert a stored ISO 639-3 code to a BCP 47 language tag.
 *
 * Codes with no two-letter equivalent (grc Ancient Greek, arz Egyptian Arabic,
 * apc Levantine Arabic, vec Venetian) are already valid BCP 47 and pass
 * through unchanged.
 */
export function toBcp47(lang: string | null | undefined): string | undefined {
	if (!lang) return undefined;
	const normalized = lang.trim().toLowerCase();
	if (!normalized) return undefined;
	return ISO_639_3_TO_1[normalized] ?? normalized;
}
