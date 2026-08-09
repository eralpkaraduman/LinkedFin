import { isIndexable, normalizePath, shouldServeGone } from "./seo-utils.ts";

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

describe("isIndexable", () => {
	test("indexes the static routes", () => {
		expect(isIndexable("/", false)).toBe(true);
		expect(isIndexable("/about", false)).toBe(true);
		expect(isIndexable("/about/", false)).toBe(true);
	});

	test("indexes detail pages whose id resolves", () => {
		expect(isIndexable("/name/nm_0118", true)).toBe(true);
		expect(isIndexable("/species/sp_024", true)).toBe(true);
		expect(isIndexable("/region/greek", true)).toBe(true);
		expect(isIndexable("/region/greek/", true)).toBe(true);
	});

	test("does not index detail pages whose id is dead", () => {
		// The SPA fallback serves a 200 shell for these — without noindex they
		// become soft 404s, which matters now the sitemap lists 622 URLs.
		expect(isIndexable("/name/nm_9999", false)).toBe(false);
		expect(isIndexable("/species/sp_999", false)).toBe(false);
		expect(isIndexable("/region/atlantis", false)).toBe(false);
	});

	test("does not index unknown paths", () => {
		expect(isIndexable("/garbage", true)).toBe(false);
		expect(isIndexable("/name", true)).toBe(false);
		expect(isIndexable("/name/nm_0118/extra", true)).toBe(false);
	});
});

describe("shouldServeGone", () => {
	// A real table size; the guard only cares that it is non-zero.
	const FULL = 512;

	test("never touches a page whose id resolves", () => {
		// The case that must never break: every live page on the site.
		expect(shouldServeGone("/name/nm_0556", 200, true, FULL)).toBe(false);
		expect(shouldServeGone("/species/sp_109", 200, true, 156)).toBe(false);
		expect(shouldServeGone("/region/greek", 200, true, 23)).toBe(false);
		expect(shouldServeGone("/region/greek/", 200, true, 23)).toBe(false);
	});

	test("404s a detail page that 200s with an unresolvable id", () => {
		// nm_0438: deleted, absent from the build, still served from a stale
		// asset in Cloudflare Pages' asset store.
		expect(shouldServeGone("/name/nm_0438", 200, false, FULL)).toBe(true);
		expect(shouldServeGone("/species/sp_999", 200, false, 156)).toBe(true);
		expect(shouldServeGone("/region/atlantis", 200, false, 23)).toBe(true);
	});

	test("does nothing when the lookup table is empty", () => {
		// THE GUARD. An empty/missing/malformed og-data.json makes every id
		// unresolvable; without this, the site would 404 itself entirely.
		expect(shouldServeGone("/name/nm_0556", 200, false, 0)).toBe(false);
		expect(shouldServeGone("/species/sp_109", 200, false, 0)).toBe(false);
		expect(shouldServeGone("/region/greek", 200, false, 0)).toBe(false);
		// Defensive: a negative size is nonsense, and must also do nothing.
		expect(shouldServeGone("/name/nm_0556", 200, false, -1)).toBe(false);
	});

	test("leaves a response the origin already 404'd alone", () => {
		// Returning our own body here would discard the app's real 404 page.
		expect(shouldServeGone("/name/nm_0438", 404, false, FULL)).toBe(false);
		expect(shouldServeGone("/name/nm_0438", 410, false, FULL)).toBe(false);
		expect(shouldServeGone("/name/nm_0438", 500, false, FULL)).toBe(false);
		expect(shouldServeGone("/name/nm_0438", 304, false, FULL)).toBe(false);
	});

	test("ignores non-detail paths", () => {
		// The homepage and /about have no id to resolve, so entryResolved is
		// false for them — they must never be caught by this.
		expect(shouldServeGone("/", 200, false, FULL)).toBe(false);
		expect(shouldServeGone("/about", 200, false, FULL)).toBe(false);
		expect(shouldServeGone("/about/", 200, false, FULL)).toBe(false);
		expect(shouldServeGone("/garbage", 200, false, FULL)).toBe(false);
		expect(shouldServeGone("/name", 200, false, FULL)).toBe(false);
		expect(shouldServeGone("/name/nm_0438/extra", 200, false, FULL)).toBe(
			false,
		);
		expect(shouldServeGone("/og/name/nm_0438", 200, false, FULL)).toBe(false);
	});
});
