/**
 * Text shaping that only the OG *image* needs.
 *
 * What a page is called and how it is described is not here — that is
 * `src/shared/pageMeta.ts`, which this endpoint imports so the card, the meta
 * tags and the structured data cannot disagree. What is left below is purely
 * about satori's font rendering: it cannot shape RTL Arabic and Noto Sans has
 * no polytonic Greek marks, so those two scripts have to be rewritten before
 * they reach the renderer. None of that applies to a `<meta>` tag, where the
 * browser renders the original characters perfectly well.
 */

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
			"…",
		)
		.replace(/\s*…\s*/g, " … ")
		.replace(/ {2,}/g, " ")
		.trim();
}

/**
 * Strip polytonic Greek combining marks unsupported by Noto Sans monotonic Greek.
 * Targets: smooth/rough breathing (U+0313/0314), perispomeni (U+0342), iota
 * subscript (U+0345).
 */
export function stripPolytonicMarks(str: string): string {
	return str
		.normalize("NFD")
		.replace(/[\u0313\u0314\u0342\u0345]/g, "")
		.normalize("NFC");
}
