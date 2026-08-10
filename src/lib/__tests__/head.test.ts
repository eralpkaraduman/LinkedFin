import { buildHead } from "#/lib/head";
import { buildNameJsonLd } from "#/shared/jsonld";
import { buildNameMeta, GENERIC_META } from "#/shared/pageMeta";
import { SITE_ORIGIN } from "#/shared/site";

const kalamar = {
	name: "Kalamar",
	lang: "tur",
	language: "Turkish",
	scientific_name: "Loligo vulgaris",
	region: "Turkish Aegean",
	etymology: "From Greek καλαμάριον kalamárion (little reed/pen)",
	transliteration: "Kalamar",
};

/** `name` for twitter:*, `property` for og:* — the attribute the tag uses. */
function get(
	head: ReturnType<typeof buildHead>,
	key: string,
): string | undefined {
	const entry = head.meta.find(
		(m) =>
			("name" in m && m.name === key) ||
			("property" in m && m.property === key),
	);
	return entry && "content" in entry ? entry.content : undefined;
}

const head = buildHead({
	path: "/name/nm_0118",
	meta: buildNameMeta(kalamar),
	jsonLd: buildNameJsonLd("nm_0118", kalamar),
});

test("title, og:title and twitter:title are the same string", () => {
	const title = head.meta.find((m) => "title" in m)?.title;
	expect(title).toBe("Kalamar — Turkish name for Loligo vulgaris | LinkedFin");
	expect(get(head, "og:title")).toBe(title);
	expect(get(head, "twitter:title")).toBe(title);
});

test("description, og:description and twitter:description are the same string", () => {
	const description = get(head, "description");
	expect(description).toContain("Kalamar is the Turkish name for");
	expect(get(head, "og:description")).toBe(description);
	expect(get(head, "twitter:description")).toBe(description);
});

test("canonical, og:url and the card URL are absolute and agree", () => {
	expect(head.links).toEqual([
		{ rel: "canonical", href: `${SITE_ORIGIN}/name/nm_0118` },
	]);
	expect(get(head, "og:url")).toBe(`${SITE_ORIGIN}/name/nm_0118`);
	expect(get(head, "og:image")).toBe(`${SITE_ORIGIN}/og/name/nm_0118`);
	expect(get(head, "twitter:image")).toBe(get(head, "og:image"));
});

/**
 * The failure this refactor exists to prevent: a tag emitted from two places
 * ends up in the document twice.
 */
test("emits each meta key exactly once", () => {
	const keys = head.meta.map((m) =>
		"title" in m ? "title" : "name" in m ? m.name : m.property,
	);
	expect(new Set(keys).size).toBe(keys.length);
});

test("carries the JSON-LD as one parseable inline script", () => {
	expect(head.scripts).toHaveLength(1);
	const script = head.scripts[0];
	expect(script.type).toBe("application/ld+json");
	const parsed = JSON.parse(script.children) as Record<string, unknown>;
	expect(parsed["@type"]).toBe("DefinedTerm");
	// The structured data repeats the page's own description, not a second one.
	expect(parsed.description).toBe(get(head, "description"));
});

test("a page with no entity claims none and stays out of the index", () => {
	const missing = buildHead({
		path: "/name/nm_9999",
		meta: GENERIC_META,
		indexable: false,
	});
	expect(missing.scripts).toEqual([]);
	expect(get(missing, "robots")).toBe("noindex, follow");
	expect(get(head, "robots")).toBe("index, follow");
});

test("region pages fall back to the generic card", () => {
	const region = buildHead({ path: "/region/turkey", meta: GENERIC_META });
	expect(get(region, "og:image")).toBe(`${SITE_ORIGIN}/og/home`);
});
