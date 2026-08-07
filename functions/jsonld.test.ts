import { describe, expect, it } from "vitest";
import {
	buildNameJsonLd,
	buildSpeciesJsonLd,
	buildWebSiteJsonLd,
	jsonLdScript,
	SITE_ORIGIN,
	serializeJsonLd,
	toBcp47,
} from "./jsonld.ts";
import type { NameRow } from "./og-utils.ts";

const greekRow: NameRow = {
	name: "Λαβράκι",
	lang: "ell",
	region_name: "Greece",
	etymology: "From Greek λάβραξ lávrax (sea bass)\n↳ From λάβρος (greedy)",
	transliteration: "Lavráki",
};

const arabicRow: NameRow = {
	name: "قاروص",
	lang: "arb",
	region_name: "Levant",
	etymology: "From Arabic قاروص qārūṣ (sea bass)",
	transliteration: "Qārūṣ",
};

/** Parse the JSON inside a `<script type="application/ld+json">` block. */
function parseScript(html: string): unknown {
	const match = html.match(
		/<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
	);
	if (!match) throw new Error("no JSON-LD script found");
	return JSON.parse(match[1]);
}

describe("toBcp47", () => {
	it("shortens ISO 639-3 codes that have a two-letter form", () => {
		expect(toBcp47("tur")).toBe("tr");
		expect(toBcp47("ell")).toBe("el");
		expect(toBcp47("arb")).toBe("ar");
		expect(toBcp47("sme")).toBe("se");
		expect(toBcp47("swe")).toBe("sv");
	});

	it("passes through codes with no two-letter equivalent", () => {
		expect(toBcp47("grc")).toBe("grc");
		expect(toBcp47("arz")).toBe("arz");
		expect(toBcp47("apc")).toBe("apc");
		expect(toBcp47("vec")).toBe("vec");
	});

	it("normalizes case and whitespace, and rejects empties", () => {
		expect(toBcp47(" TUR ")).toBe("tr");
		expect(toBcp47("")).toBeUndefined();
		expect(toBcp47(null)).toBeUndefined();
		expect(toBcp47(undefined)).toBeUndefined();
	});
});

describe("serializeJsonLd", () => {
	it("round-trips through JSON.parse", () => {
		const value = { "@type": "Thing", name: "Λαβράκι" };
		expect(JSON.parse(serializeJsonLd(value))).toEqual(value);
	});

	it("cannot break out of the script tag", () => {
		const value = {
			"@type": "Thing",
			name: '</script><img src=x onerror="alert(1)">',
		};
		const html = jsonLdScript(value);
		expect(html).not.toContain("</script><img");
		// exactly one closing tag: the real one
		expect(html.match(/<\/script>/g)).toHaveLength(1);
		expect(parseScript(html)).toEqual(value);
	});

	it("escapes <, > and & but keeps them parseable", () => {
		const serialized = serializeJsonLd({ name: "a<b>c&d" });
		expect(serialized).not.toMatch(/[<>&]/);
		expect(JSON.parse(serialized)).toEqual({ name: "a<b>c&d" });
	});

	it("escapes U+2028/U+2029", () => {
		const value = { name: "a\u2028b\u2029c" };
		const serialized = serializeJsonLd(value);
		expect(serialized).not.toMatch(/[\u2028\u2029]/);
		expect(JSON.parse(serialized)).toEqual(value);
	});

	it("keeps Greek, Arabic, Turkish and typographic characters intact", () => {
		const value = {
			name: 'Λαβράκι · قاروص — Sarıgöz ↳ don\'t "quote" me',
		};
		expect(JSON.parse(serializeJsonLd(value))).toEqual(value);
	});

	it("emits nothing for a null entity", () => {
		expect(jsonLdScript(null)).toBe("");
	});
});

describe("buildNameJsonLd", () => {
	it("describes a name as a DefinedTerm in the site term set", () => {
		const term = buildNameJsonLd("nm_0118", greekRow) as Record<
			string,
			// biome-ignore lint/suspicious/noExplicitAny: test assertion on JSON-LD
			any
		>;

		expect(term["@context"]).toBe("https://schema.org");
		expect(term["@type"]).toBe("DefinedTerm");
		expect(term["@id"]).toBe(`${SITE_ORIGIN}/name/nm_0118#term`);
		expect(term.url).toBe(`${SITE_ORIGIN}/name/nm_0118`);
		expect(term.name).toBe("Λαβράκι");
		expect(term.termCode).toBe("nm_0118");
		expect(term.alternateName).toBe("Lavráki");
		expect(term.inLanguage).toBe("el");
		expect(term.description).toContain("Greek · Greece —");
		// etymology newlines are collapsed, the ↳ chain survives
		expect(term.description).not.toContain("\n");
		expect(term.description).toContain("↳");

		expect(term.inDefinedTermSet["@type"]).toBe("DefinedTermSet");
		expect(term.inDefinedTermSet["@id"]).toBe(`${SITE_ORIGIN}/#fish-names`);
		expect(term.inDefinedTermSet.inLanguage).toBe("el");
	});

	it("uses the BCP 47 tag for Arabic and keeps the Arabic script", () => {
		const parsed = parseScript(
			jsonLdScript(buildNameJsonLd("nm_0034", arabicRow)),
			// biome-ignore lint/suspicious/noExplicitAny: test assertion on JSON-LD
		) as any;
		expect(parsed.inLanguage).toBe("ar");
		expect(parsed.name).toBe("قاروص");
		expect(parsed.alternateName).toBe("Qārūṣ");
	});

	it("omits alternateName when there is no distinct transliteration", () => {
		const term = buildNameJsonLd("nm_0001", {
			name: "Sea bass",
			lang: "eng",
			region_name: "International",
			etymology: null,
			transliteration: null,
		});
		expect(term).not.toHaveProperty("alternateName");
		expect(term.description).toBe("English · International");
	});
});

describe("buildSpeciesJsonLd", () => {
	it("describes a species as a Taxon with vernacular alternateNames", () => {
		const taxon = buildSpeciesJsonLd(
			"sp_024",
			{ scientific_name: "Dicentrarchus labrax" },
			["Levrek", "Λαβράκι", "Levrek"],
			// biome-ignore lint/suspicious/noExplicitAny: test assertion on JSON-LD
		) as any;

		expect(taxon["@type"]).toBe("Taxon");
		expect(taxon["@id"]).toBe(`${SITE_ORIGIN}/species/sp_024#taxon`);
		expect(taxon.url).toBe(`${SITE_ORIGIN}/species/sp_024`);
		expect(taxon.name).toBe("Dicentrarchus labrax");
		expect(taxon.taxonRank).toBe("species");
		// duplicates collapsed
		expect(taxon.alternateName).toEqual(["Levrek", "Λαβράκι"]);
	});

	it("omits alternateName when the species has no names", () => {
		const taxon = buildSpeciesJsonLd("sp_999", { scientific_name: "X y" }, []);
		expect(taxon).not.toHaveProperty("alternateName");
	});
});

describe("buildWebSiteJsonLd", () => {
	it("declares the homepage search box", () => {
		// biome-ignore lint/suspicious/noExplicitAny: test assertion on JSON-LD
		const site = buildWebSiteJsonLd() as any;
		expect(site["@type"]).toBe("WebSite");
		expect(site.url).toBe(`${SITE_ORIGIN}/`);
		expect(site.potentialAction["@type"]).toBe("SearchAction");
		expect(site.potentialAction.target).toEqual({
			"@type": "EntryPoint",
			urlTemplate: `${SITE_ORIGIN}/?q={search_term_string}`,
		});
		expect(site.potentialAction["query-input"]).toBe(
			"required name=search_term_string",
		);
	});

	it("survives serialization (the template braces are not JSON syntax)", () => {
		const parsed = parseScript(jsonLdScript(buildWebSiteJsonLd())) as Record<
			string,
			unknown
		>;
		expect(parsed).toEqual(buildWebSiteJsonLd());
	});
});
