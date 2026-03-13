import { describe, it, expect } from "vitest";
import {
	getLangName,
	sanitize,
	truncate,
	isArabicLang,
	stripArabic,
	buildNameOg,
	buildSpeciesOg,
	GENERIC_OG,
	GENERIC_META,
} from "./og-utils.js";

describe("getLangName", () => {
	it("returns display name for known codes", () => {
		expect(getLangName("tur")).toBe("Turkish");
		expect(getLangName("ell")).toBe("Greek");
		expect(getLangName("eng")).toBe("English");
		expect(getLangName("arb")).toBe("Standard Arabic");
		expect(getLangName("arz")).toBe("Egyptian Arabic");
		expect(getLangName("apc")).toBe("Levantine Arabic");
		expect(getLangName("grc")).toBe("Ancient Greek");
		expect(getLangName("fin")).toBe("Finnish");
		expect(getLangName("swe")).toBe("Swedish");
		expect(getLangName("est")).toBe("Estonian");
		expect(getLangName("sme")).toBe("Northern Sami");
		expect(getLangName("ita")).toBe("Italian");
		expect(getLangName("fas")).toBe("Persian");
		expect(getLangName("vec")).toBe("Venetian");
	});

	it("returns the code itself for unknown codes", () => {
		expect(getLangName("xyz")).toBe("xyz");
		expect(getLangName("jpn")).toBe("jpn");
	});
});

describe("sanitize", () => {
	it("collapses whitespace and trims", () => {
		expect(sanitize("  hello   world  ")).toBe("hello world");
		expect(sanitize("line1\nline2\ttab")).toBe("line1 line2 tab");
	});

	it("handles null/undefined", () => {
		expect(sanitize(null)).toBe("");
		expect(sanitize(undefined)).toBe("");
		expect(sanitize("")).toBe("");
	});
});

describe("truncate", () => {
	it("returns string unchanged if under max", () => {
		expect(truncate("short", 100)).toBe("short");
	});

	it("truncates at last space before max", () => {
		const result = truncate("hello beautiful world", 16);
		expect(result).toBe("hello beautiful\u2026");
	});

	it("truncates at max if no space found", () => {
		const result = truncate("abcdefghijklmnop", 10);
		expect(result).toBe("abcdefghij\u2026");
	});

	it("uses custom separator", () => {
		const result = truncate("one, two, three, four", 18, ", ");
		expect(result).toBe("one, two, three\u2026");
	});
});

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
			stripArabic("From Arabic مزيت mazīt (oily/greasy) — From زيت zayt (olive oil)"),
		).toBe("From Arabic \u2026 maz\u012Bt (oily/greasy) \u2014 From \u2026 zayt (olive oil)");
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

describe("buildNameOg", () => {
	it("builds title and description with language and region", () => {
		const row = {
			name: "Barbun",
			lang: "tur",
			region_name: "Turkish Aegean",
			etymology: "From Greek μπαρμπούνι barboúni",
			transliteration: null,
		};
		const result = buildNameOg(row);
		expect(result.title).toBe("Barbun");
		expect(result.description).toBe(
			"Turkish · Turkish Aegean — From Greek μπαρμπούνι barboúni",
		);
	});

	it("keeps Arabic name in title (meta tags render Arabic fine)", () => {
		const row = {
			name: "سلطان ابراهيم",
			lang: "apc",
			region_name: "Levant",
			etymology: "Compound: سلطان + ابراهيم",
			transliteration: "Sultan Ibrahim",
		};
		const result = buildNameOg(row);
		expect(result.title).toBe("سلطان ابراهيم");
		expect(result.description).toContain("Levantine Arabic · Levant");
	});

	it("uses original name for non-Arabic with transliteration", () => {
		const row = {
			name: "Συναγρίδα",
			lang: "ell",
			region_name: "Greece",
			etymology: "From Ancient Greek",
			transliteration: "Synagrida",
		};
		const result = buildNameOg(row);
		expect(result.title).toBe("Συναγρίδα");
	});

	it("handles missing etymology", () => {
		const row = {
			name: "Sipar",
			lang: "tur",
			region_name: "Turkish Black Sea",
			etymology: null,
			transliteration: null,
		};
		const result = buildNameOg(row);
		expect(result.title).toBe("Sipar");
		expect(result.description).toBe("Turkish · Turkish Black Sea");
	});

	it("handles empty etymology", () => {
		const row = {
			name: "Test",
			lang: "eng",
			region_name: "International",
			etymology: "",
			transliteration: null,
		};
		const result = buildNameOg(row);
		expect(result.description).toBe("English · International");
	});

	it("sanitizes multiline etymology", () => {
		const row = {
			name: "Lohi",
			lang: "fin",
			region_name: "Finland",
			etymology: "From Proto-Finnic *lohi\n↳ Possibly from PIE *laks-",
			transliteration: null,
		};
		const result = buildNameOg(row);
		expect(result.description).toBe(
			"Finnish · Finland — From Proto-Finnic *lohi ↳ Possibly from PIE *laks-",
		);
	});
});

describe("buildSpeciesOg", () => {
	it("builds title and description from species and names", () => {
		const species = { scientific_name: "Mullus barbatus" };
		const names = [
			{ name: "Barbun" },
			{ name: "Μπαρμπούνι" },
			{ name: "بربون" },
			{ name: "Red mullet" },
		];
		const result = buildSpeciesOg(species, names);
		expect(result.title).toBe("Mullus barbatus");
		expect(result.description).toBe("Barbun, Μπαρμπούνι, بربون, Red mullet");
	});

	it("falls back to scientific name when no names", () => {
		const species = { scientific_name: "Gadus morhua" };
		const result = buildSpeciesOg(species, []);
		expect(result.title).toBe("Gadus morhua");
		expect(result.description).toBe("Gadus morhua");
	});
});

describe("constants", () => {
	it("GENERIC_OG has expected shape", () => {
		expect(GENERIC_OG.title).toBe("LinkedFin");
		expect(GENERIC_OG.description).toBeTruthy();
	});

	it("GENERIC_META has expected shape", () => {
		expect(GENERIC_META.title).toContain("LinkedFin");
		expect(GENERIC_META.description).toBeTruthy();
	});
});
