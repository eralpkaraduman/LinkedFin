import { canonicalUrl, isIndexable, normalizePath } from "./seo-utils.ts";

describe("normalizePath", () => {
	test("leaves the root alone", () => {
		expect(normalizePath("/")).toBe("/");
	});

	test("strips a trailing slash so /about and /about/ are one URL", () => {
		expect(normalizePath("/about/")).toBe("/about");
		expect(normalizePath("/name/nm_0118/")).toBe("/name/nm_0118");
	});

	test("leaves already-normal paths unchanged", () => {
		expect(normalizePath("/name/nm_0118")).toBe("/name/nm_0118");
	});
});

describe("canonicalUrl", () => {
	test("uses the page's own URL, not the site root", () => {
		expect(canonicalUrl(new URL("https://linkedfin.net/name/nm_0118"))).toBe(
			"https://linkedfin.net/name/nm_0118",
		);
	});

	test("drops the query string", () => {
		// ?page/?sort/?dir/?q are views of one document, not separate pages.
		expect(
			canonicalUrl(new URL("https://linkedfin.net/?page=3&sort=region")),
		).toBe("https://linkedfin.net/");
		expect(canonicalUrl(new URL("https://linkedfin.net/?q=lobster"))).toBe(
			"https://linkedfin.net/",
		);
	});

	test("normalizes a trailing slash", () => {
		expect(canonicalUrl(new URL("https://linkedfin.net/about/"))).toBe(
			"https://linkedfin.net/about",
		);
	});
});

describe("isIndexable", () => {
	test("indexes the static routes", () => {
		expect(isIndexable("/", false)).toBe(true);
		expect(isIndexable("/about", false)).toBe(true);
		expect(isIndexable("/about/", false)).toBe(true);
	});

	test("indexes detail pages whose id resolves", () => {
		expect(isIndexable("/name/nm_0118", true)).toBe(true);
		expect(isIndexable("/species/sp_024", true)).toBe(true);
	});

	test("does not index detail pages whose id is dead", () => {
		// The SPA fallback serves a 200 shell for these — without noindex they
		// become soft 404s, which matters now the sitemap lists 622 URLs.
		expect(isIndexable("/name/nm_9999", false)).toBe(false);
		expect(isIndexable("/species/sp_999", false)).toBe(false);
	});

	test("does not index unknown paths", () => {
		expect(isIndexable("/garbage", true)).toBe(false);
		expect(isIndexable("/name", true)).toBe(false);
		expect(isIndexable("/name/nm_0118/extra", true)).toBe(false);
	});
});
