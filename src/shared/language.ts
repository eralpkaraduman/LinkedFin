/**
 * Language-tag conversion, with no dependency on `Intl`.
 *
 * Split out of `src/lib/language.ts` so the Worker-safe half can be imported
 * from `functions/` and from `src/shared/jsonld.ts` without dragging
 * `Intl.DisplayNames` (and the module-scope constructor call that comes with
 * it) along. `src/lib/language.ts` re-exports `toBcp47`, so app code keeps its
 * single import site; the English display names stay there, because only the
 * build-time generator needs them.
 *
 * This is the mapping `functions/jsonld.ts` used to keep a second copy of.
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
 * BCP 47 prefers the shortest available tag, so `tur` must be emitted as `tr`.
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
