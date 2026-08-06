import { toBcp47 } from "#/lib/language";

describe("toBcp47", () => {
	test("shortens ISO 639-3 codes that have a two-letter form", () => {
		expect(toBcp47("tur")).toBe("tr");
		expect(toBcp47("ell")).toBe("el");
		expect(toBcp47("arb")).toBe("ar");
		expect(toBcp47("swe")).toBe("sv");
		expect(toBcp47("sme")).toBe("se");
	});

	test("passes through codes with no two-letter equivalent", () => {
		// grc Ancient Greek, arz Egyptian Arabic, apc Levantine Arabic, vec Venetian
		expect(toBcp47("grc")).toBe("grc");
		expect(toBcp47("arz")).toBe("arz");
		expect(toBcp47("apc")).toBe("apc");
		expect(toBcp47("vec")).toBe("vec");
	});

	test("normalizes casing and whitespace", () => {
		expect(toBcp47(" TUR ")).toBe("tr");
	});

	test("returns undefined for missing input so the attribute is omitted", () => {
		expect(toBcp47(null)).toBeUndefined();
		expect(toBcp47(undefined)).toBeUndefined();
		expect(toBcp47("")).toBeUndefined();
		expect(toBcp47("   ")).toBeUndefined();
	});

	test("covers every language code present in the database", () => {
		// From: SELECT DISTINCT lang FROM names (2026-08-06)
		const codes = [
			"tur",
			"eng",
			"ell",
			"fin",
			"swe",
			"grc",
			"arb",
			"est",
			"ita",
			"arz",
			"apc",
			"sme",
			"nor",
			"nld",
			"fra",
			"deu",
			"vec",
			"spa",
			"pol",
			"fas",
			"dan",
		];
		for (const code of codes) {
			const tag = toBcp47(code);
			expect(tag).toBeDefined();
			// BCP 47 primary subtag: 2 or 3 letters.
			expect(tag).toMatch(/^[a-z]{2,3}$/);
		}
	});
});
