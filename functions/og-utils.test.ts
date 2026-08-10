import { describe, expect, it } from "vitest";
import { isArabicLang, stripArabic, stripPolytonicMarks } from "./og-utils.ts";

describe("isArabicLang", () => {
	it("detects Arabic language codes", () => {
		expect(isArabicLang("arb")).toBe(true);
		expect(isArabicLang("arz")).toBe(true);
		expect(isArabicLang("apc")).toBe(true);
	});

	it("returns false for non-Arabic languages", () => {
		expect(isArabicLang("tur")).toBe(false);
		expect(isArabicLang("ell")).toBe(false);
		expect(isArabicLang("eng")).toBe(false);
	});
});

describe("stripArabic", () => {
	it("replaces Arabic word with ellipsis, keeps transliteration", () => {
		expect(stripArabic("From Arabic مزيت mazīt (oily/greasy)")).toBe(
			"From Arabic \u2026 maz\u012Bt (oily/greasy)",
		);
	});

	it("handles multiple Arabic words", () => {
		expect(
			stripArabic(
				"From Arabic مزيت mazīt (oily/greasy) — From زيت zayt (olive oil)",
			),
		).toBe(
			"From Arabic \u2026 maz\u012Bt (oily/greasy) \u2014 From \u2026 zayt (olive oil)",
		);
	});

	it("handles Arabic-only compound", () => {
		expect(stripArabic("Compound: سلطان + ابراهيم")).toBe(
			"Compound: \u2026 + \u2026",
		);
	});

	it("returns string unchanged when no Arabic", () => {
		expect(stripArabic("From Greek μπαρμπούνι barboúni")).toBe(
			"From Greek μπαρμπούνι barboúni",
		);
	});

	it("handles empty string", () => {
		expect(stripArabic("")).toBe("");
	});

	it("handles pure Arabic string", () => {
		expect(stripArabic("مرجان")).toBe("\u2026");
	});

	it("normalizes whitespace around ellipsis", () => {
		const result = stripArabic("word  مزيت  next");
		expect(result).not.toContain("  ");
		expect(result).toContain("\u2026");
	});
});

describe("stripPolytonicMarks", () => {
	it("drops breathings and iota subscript Noto Sans cannot draw", () => {
		expect(stripPolytonicMarks("ἰχθύς")).toBe("ιχθύς");
		expect(stripPolytonicMarks("ᾧ")).toBe("ω");
	});

	it("leaves monotonic Greek and Latin alone", () => {
		expect(stripPolytonicMarks("Λαβράκι")).toBe("Λαβράκι");
		expect(stripPolytonicMarks("Sarıgöz")).toBe("Sarıgöz");
	});
});
