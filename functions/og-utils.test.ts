import { describe, expect, it } from "vitest";
import {
	hasArabicScript,
	stripArabic,
	stripPolytonicMarks,
} from "./og-utils.ts";

describe("hasArabicScript", () => {
	it("detects Arabic and Persian script", () => {
		expect(hasArabicScript("سلطان ابراهيم")).toBe(true);
		expect(hasArabicScript("ساسان")).toBe(true);
	});
	it("is false for Latin and Greek", () => {
		expect(hasArabicScript("Levrek")).toBe(false);
		expect(hasArabicScript("μπαρμπούνι")).toBe(false);
	});
});

describe("stripArabic", () => {
	it("drops the Arabic word, keeps the transliteration", () => {
		expect(stripArabic("From Arabic مزيت mazīt (oily/greasy)")).toBe(
			"From Arabic mazīt (oily/greasy)",
		);
	});

	it("handles multiple Arabic words", () => {
		expect(
			stripArabic(
				"From Arabic مزيت mazīt (oily/greasy) — From زيت zayt (olive oil)",
			),
		).toBe("From Arabic mazīt (oily/greasy) — From zayt (olive oil)");
	});

	it("collapses an all-Arabic compound line", () => {
		expect(
			stripArabic(
				"Compound: سلطان + ابراهيم سلطان sulṭān: sultan, ابراهيم ibrāhīm: Ibrahim",
			),
		).toBe("Compound: sulṭān: sultan, ibrāhīm: Ibrahim");
	});

	it("keeps Latin compounds intact", () => {
		expect(stripArabic("Compound: kum + pire")).toBe("Compound: kum + pire");
	});

	it("returns string unchanged when no Arabic", () => {
		expect(stripArabic("From Greek μπαρμπούνι barboúni")).toBe(
			"From Greek μπαρμπούνι barboúni",
		);
	});

	it("handles empty and pure Arabic strings", () => {
		expect(stripArabic("")).toBe("");
		expect(stripArabic("مرجان")).toBe("");
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
