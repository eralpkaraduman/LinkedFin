import { describe, expect, it } from "vitest";
import {
	buildNameMeta,
	buildRegionMeta,
	buildSpeciesMeta,
	CARD_DESCRIPTION_LIMIT,
	GENERIC_META,
	type NameMetaInput,
	ogImagePath,
	SITE_TAGLINE,
	sanitize,
	truncate,
} from "#/shared/pageMeta";

function makeName(over: Partial<NameMetaInput> = {}): NameMetaInput {
	return {
		name: "Levrek",
		lang: "tur",
		language: "Turkish",
		scientific_name: "Dicentrarchus labrax",
		region: "Turkey",
		etymology: "From Greek labrax.",
		transliteration: "Levrek",
		...over,
	};
}

describe("sanitize", () => {
	it("collapses whitespace and trims", () => {
		expect(sanitize("  a \n b\tc  ")).toBe("a b c");
	});

	it("handles null and undefined", () => {
		expect(sanitize(null)).toBe("");
		expect(sanitize(undefined)).toBe("");
	});
});

describe("truncate", () => {
	it("cuts on a word boundary and collapses whitespace", () => {
		expect(truncate("one   two\nthree", 100)).toBe("one two three");
		expect(truncate("aaa bbb ccc", 8)).toBe("aaa bbb…");
	});

	it("cuts hard when there is no space to break on", () => {
		expect(truncate("aaaaaaaaaa", 4)).toBe("aaaa…");
	});
});

describe("buildNameMeta", () => {
	it("front-loads the name and includes the etymology", () => {
		const { title, description, headline } = buildNameMeta(makeName());
		expect(title).toBe(
			"Levrek — Turkish name for Dicentrarchus labrax | LinkedFin",
		);
		expect(headline).toBe("Levrek");
		expect(description).toBe(
			"Levrek is the Turkish name for Dicentrarchus labrax in Turkey. From Greek labrax.",
		);
	});

	it("still describes a name with no etymology", () => {
		expect(buildNameMeta(makeName({ etymology: "" })).description).toBe(
			"Levrek is the Turkish name for Dicentrarchus labrax in Turkey.",
		);
		expect(buildNameMeta(makeName({ etymology: null })).description).toBe(
			"Levrek is the Turkish name for Dicentrarchus labrax in Turkey.",
		);
	});

	it("collapses a multiline etymology", () => {
		const meta = buildNameMeta(
			makeName({ etymology: "From Greek\n  labrax,\tvia Latin." }),
		);
		expect(meta.description).toContain("From Greek labrax, via Latin.");
	});

	it("keeps the name in its own script — only the card strips Arabic", () => {
		const meta = buildNameMeta(
			makeName({
				name: "سمك",
				lang: "arb",
				language: "Standard Arabic",
				transliteration: "samak",
			}),
		);
		expect(meta.headline).toBe("سمك");
		expect(meta.title).toContain("سمك");
	});

	it("adds the transliteration to the title when it differs from the name", () => {
		const meta = buildNameMeta(
			makeName({
				name: "Çinekop",
				transliteration: "Chinekop",
			}),
		);
		expect(meta.title).toBe(
			"Çinekop (Chinekop) — Turkish name for Dicentrarchus labrax | LinkedFin",
		);
		// headline and description are unaffected — only the <title> changes
		expect(meta.headline).toBe("Çinekop");
		expect(meta.description.startsWith("Çinekop is the")).toBe(true);
	});

	it("does not duplicate the name when transliteration equals it", () => {
		const meta = buildNameMeta(
			makeName({ name: "Levrek", transliteration: "Levrek" }),
		);
		expect(meta.title).toBe(
			"Levrek — Turkish name for Dicentrarchus labrax | LinkedFin",
		);
	});

	/**
	 * The reason there is one builder rather than two: a 1200x630 card and a
	 * link preview want the same words at different lengths.
	 */
	it("takes a shorter description for the OG card", () => {
		const long = makeName({ etymology: "word ".repeat(80) });
		const card = buildNameMeta(long, {
			descriptionLimit: CARD_DESCRIPTION_LIMIT,
		});
		const page = buildNameMeta(long);
		expect(card.description.length).toBeLessThanOrEqual(
			CARD_DESCRIPTION_LIMIT + 1,
		);
		expect(page.description.length).toBeGreaterThan(card.description.length);
		expect(page.description.startsWith(card.description.slice(0, 40))).toBe(
			true,
		);
		// Same title either way — only the budget differs.
		expect(card.title).toBe(page.title);
	});
});

describe("buildSpeciesMeta", () => {
	it("lists the names and front-loads the scientific name", () => {
		const meta = buildSpeciesMeta({
			scientificName: "Pomatomus saltatrix",
			notes: "A pelagic predator.",
			names: ["Lüfer", "Γοφάρι"],
		});
		expect(meta.title).toBe(
			"Pomatomus saltatrix — fish names and etymology | LinkedFin",
		);
		expect(meta.headline).toBe("Pomatomus saltatrix");
		expect(meta.description).toBe(
			"Pomatomus saltatrix is called Lüfer, Γοφάρι. A pelagic predator.",
		);
	});

	it("falls back to the scientific name when there are no vernacular names", () => {
		expect(
			buildSpeciesMeta({
				scientificName: "Pomatomus saltatrix",
				notes: null,
				names: [],
			}).description,
		).toBe("Pomatomus saltatrix.");
	});
});

describe("buildRegionMeta", () => {
	it("front-loads the region and counts its names", () => {
		const meta = buildRegionMeta({
			name: "Turkey",
			names: ["Levrek", "Lüfer"],
		});
		expect(meta.title).toBe("Turkey — fish names and etymology | LinkedFin");
		expect(meta.headline).toBe("Turkey fish names");
		expect(meta.description).toContain("2 fish names from Turkey");
		expect(meta.description).toContain("Levrek");
	});

	it("keeps the count singular for a one-name region", () => {
		expect(
			buildRegionMeta({ name: "Greece", names: ["Lavraki"] }).description,
		).toContain("1 fish name from Greece");
	});
});

describe("ogImagePath", () => {
	it("gives names and species their own card", () => {
		expect(ogImagePath("/name/nm_0118")).toBe("/og/name/nm_0118");
		expect(ogImagePath("/species/sp_001")).toBe("/og/species/sp_001");
	});

	it("falls back to the generic card everywhere else, regions included", () => {
		expect(ogImagePath("/region/turkey")).toBe("/og/home");
		expect(ogImagePath("/")).toBe("/og/home");
		expect(ogImagePath("/about")).toBe("/og/home");
		expect(ogImagePath("/name/nm_0118/extra")).toBe("/og/home");
	});
});

describe("GENERIC_META", () => {
	it("leads with the tagline the WebSite entity also uses", () => {
		expect(GENERIC_META.description.startsWith(SITE_TAGLINE)).toBe(true);
		expect(GENERIC_META.title).toBe(
			"LinkedFin - Fish Names Etymology Database",
		);
		expect(GENERIC_META.headline).toBe("LinkedFin");
	});
});
