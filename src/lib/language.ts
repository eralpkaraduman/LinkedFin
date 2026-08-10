/**
 * Language display helpers.
 *
 * `names.lang` stores ISO 639-3 codes (validated by
 * maintenance/scripts/validate-integrity.ts).
 *
 * The BCP 47 conversion lives in `src/shared/language.ts` and is re-exported
 * here so app code keeps one import site. It had to move because
 * `functions/jsonld.ts` kept a second copy of the same table, and because
 * `src/shared/` must stay free of `Intl` — the display names below construct
 * an `Intl.DisplayNames` at module scope, which is not something to drag into
 * a Worker bundle that has no use for it.
 */

export { toBcp47 } from "#/shared/language";

/**
 * English display name for a stored ISO 639-3 code.
 *
 * `Intl.DisplayNames` covers most codes; the overrides fill the gaps where it
 * echoes the raw code back (the Arabic varieties, Ancient Greek, Northern Sami).
 *
 * Lives here rather than in `database.ts` because the same mapping has to be
 * applied twice: once in the browser when the sqlite-wasm database is read, and
 * once in Node when `og:generate` bakes the prerender dataset. Both call this.
 */
const languageDisplayNames = new Intl.DisplayNames(["en"], {
	type: "language",
});

const LANGUAGE_NAME_OVERRIDES: Record<string, string> = {
	arb: "Standard Arabic",
	apc: "Levantine Arabic",
	arz: "Egyptian Arabic",
	grc: "Ancient Greek",
	sme: "Northern Sami",
};

export function getLanguageName(code: string): string {
	return LANGUAGE_NAME_OVERRIDES[code] || languageDisplayNames.of(code) || code;
}
