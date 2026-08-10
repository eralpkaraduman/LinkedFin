import { describe, expect, it } from "vitest";
import {
	buildNameJsonLd,
	buildRegionJsonLd,
	buildSpeciesJsonLd,
	buildWebSiteJsonLd,
	type JsonLd,
	serializeJsonLd,
} from "#/shared/jsonld";
import type { NameMetaInput } from "#/shared/pageMeta";
import { SITE_ORIGIN } from "#/shared/site";

const greekRow: NameMetaInput = {
	name: "Λαβράκι",
	lang: "ell",
	language: "Greek",
	scientific_name: "Dicentrarchus labrax",
	region: "Greece",
	etymology: "From Greek λάβραξ lávrax (sea bass)\n↳ From λάβρος (greedy)",
	transliteration: "Lavráki",
};

const arabicRow: NameMetaInput = {
	name: "قاروص",
	lang: "arb",
	language: "Standard Arabic",
	scientific_name: "Dicentrarchus labrax",
	region: "Levant",
	etymology: "From Arabic قاروص qārūṣ (sea bass)",
	transliteration: "Qārūṣ",
};

/**
 * Wrap and re-read a payload the way a route's `head()` does: the serialized
 * string goes straight into a `<script type="application/ld+json">` body.
 */
function scriptTag(value: JsonLd): string {
	return `<script type="application/ld+json">${serializeJsonLd(value)}</script>`;
}

function parseScript(html: string): unknown {
	const match = html.match(
		/<script type="application\/ld\+json">([\s\S]*?)<\/script>/,
	);
	if (!match) throw new Error("no JSON-LD script found");
	return JSON.parse(match[1]);
}

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
		const html = scriptTag(value);
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

	/**
	 * The reason `src/lib/head.ts` uses `scripts` with this serializer rather
	 * than TanStack Router's built-in `{ "script:ld+json": … }` meta entry: that
	 * path HTML-escapes the payload, and `&quot;` inside a `<script>` body is
	 * not JSON.
	 */
	it("leaves quotes as quotes, which a script body requires", () => {
		expect(serializeJsonLd({ name: "x" })).toContain('"name":"x"');
		expect(serializeJsonLd({ name: "x" })).not.toContain("&quot;");
	});
});

describe("buildNameJsonLd", () => {
	it("describes a name as a DefinedTerm in the site term set", () => {
		// biome-ignore lint/suspicious/noExplicitAny: test assertion on JSON-LD
		const term = buildNameJsonLd("nm_0118", greekRow) as any;

		expect(term["@context"]).toBe("https://schema.org");
		expect(term["@type"]).toBe("DefinedTerm");
		expect(term["@id"]).toBe(`${SITE_ORIGIN}/name/nm_0118#term`);
		expect(term.url).toBe(`${SITE_ORIGIN}/name/nm_0118`);
		expect(term.name).toBe("Λαβράκι");
		expect(term.termCode).toBe("nm_0118");
		expect(term.alternateName).toBe("Lavráki");
		expect(term.inLanguage).toBe("el");
		// The same sentence the page's <meta description> carries.
		expect(term.description).toContain(
			"Λαβράκι is the Greek name for Dicentrarchus labrax in Greece.",
		);
		// etymology newlines are collapsed, the ↳ chain survives
		expect(term.description).not.toContain("\n");
		expect(term.description).toContain("↳");

		expect(term.inDefinedTermSet["@type"]).toBe("DefinedTermSet");
		expect(term.inDefinedTermSet["@id"]).toBe(`${SITE_ORIGIN}/#fish-names`);
		expect(term.inDefinedTermSet.inLanguage).toBe("el");
	});

	it("uses the BCP 47 tag for Arabic and keeps the Arabic script", () => {
		const parsed = parseScript(
			scriptTag(buildNameJsonLd("nm_0034", arabicRow)),
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
			language: "English",
			scientific_name: "Dicentrarchus labrax",
			region: "International",
			etymology: null,
			transliteration: null,
		});
		expect(term).not.toHaveProperty("alternateName");
		expect(term.description).toBe(
			"Sea bass is the English name for Dicentrarchus labrax in International.",
		);
	});
});

describe("buildSpeciesJsonLd", () => {
	it("describes a species as a Taxon with vernacular alternateNames", () => {
		const taxon = buildSpeciesJsonLd("sp_024", {
			scientificName: "Dicentrarchus labrax",
			notes: null,
			names: ["Levrek", "Λαβράκι", "Levrek"],
			// biome-ignore lint/suspicious/noExplicitAny: test assertion on JSON-LD
		}) as any;

		expect(taxon["@type"]).toBe("Taxon");
		expect(taxon["@id"]).toBe(`${SITE_ORIGIN}/species/sp_024#taxon`);
		expect(taxon.url).toBe(`${SITE_ORIGIN}/species/sp_024`);
		expect(taxon.name).toBe("Dicentrarchus labrax");
		expect(taxon.taxonRank).toBe("species");
		// duplicates collapsed
		expect(taxon.alternateName).toEqual(["Levrek", "Λαβράκι"]);
	});

	it("omits alternateName when the species has no names", () => {
		const taxon = buildSpeciesJsonLd("sp_999", {
			scientificName: "X y",
			notes: null,
			names: [],
		});
		expect(taxon).not.toHaveProperty("alternateName");
	});
});

describe("buildRegionJsonLd", () => {
	const greece = {
		name: "Greece",
		names: Array.from({ length: 70 }, (_, i) => `n${i}`),
	};

	it("describes the listing page and ties it to the site", () => {
		// biome-ignore lint/suspicious/noExplicitAny: test assertion on JSON-LD
		const page = buildRegionJsonLd("greek", greece) as any;
		expect(page["@type"]).toBe("CollectionPage");
		expect(page.url).toBe(`${SITE_ORIGIN}/region/greek`);
		expect(page.name).toBe("Greece fish names");
		expect(page.description).toContain("70 fish names from Greece");
		expect(page.isPartOf["@id"]).toBe(`${SITE_ORIGIN}/#website`);
		expect(page.mainEntity["@type"]).toBe("DefinedTermSet");
	});

	it("keeps the count singular for a one-name region", () => {
		const page = buildRegionJsonLd("poland", {
			name: "Poland",
			names: ["Okoń"],
			// biome-ignore lint/suspicious/noExplicitAny: test assertion on JSON-LD
		}) as any;
		expect(page.description).toContain("1 fish name from Poland");
	});

	it("survives serialization", () => {
		const input = { name: "Sápmi", names: ["Luosa"] };
		expect(parseScript(scriptTag(buildRegionJsonLd("sapmi", input)))).toEqual(
			buildRegionJsonLd("sapmi", input),
		);
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
		const parsed = parseScript(scriptTag(buildWebSiteJsonLd())) as Record<
			string,
			unknown
		>;
		expect(parsed).toEqual(buildWebSiteJsonLd());
	});
});
