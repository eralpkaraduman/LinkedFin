/**
 * Post-build assertions.
 *
 * Prerendering can fail *silently*: if `.generated/` is missing, vite.config
 * warns and carries on, and `vite build` exits 0 having produced no index.html
 * and no detail pages at all. The same silent shape can appear if the
 * prerender queue de-duplicates the homepage entry away (see the
 * `?prerender=home` note in vite.config.ts) after a plugin upgrade.
 *
 * Cloudflare Pages deploys whatever `dist/client` contains, so a green build
 * with an empty output ships a broken site. This turns that into a hard
 * failure at build time.
 *
 * Run: pnpm verify:build (wired into `pnpm build`)
 */

import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const DIST = resolve(ROOT, "dist/client");
const DB_PATH = resolve(ROOT, "public/fish.db");

const errors: string[] = [];

function fail(message: string) {
	errors.push(message);
}

if (!existsSync(DIST)) {
	console.error(`❌ ${DIST} does not exist — did vite build run?`);
	process.exit(1);
}

const db = new Database(DB_PATH, { readonly: true });
const nameIds = db.prepare("SELECT id FROM names ORDER BY id").all() as {
	id: string;
}[];
const speciesIds = db.prepare("SELECT id FROM species ORDER BY id").all() as {
	id: string;
}[];
/** Regions with at least one name — the set og-data-gen prerenders. */
const regionIds = db
	.prepare(
		"SELECT regions.id FROM regions JOIN names ON names.region_id = regions.id GROUP BY regions.id ORDER BY regions.id",
	)
	.all() as { id: string }[];
/** The biggest region, whose page is the one most likely to be truncated. */
const largestRegion = db
	.prepare(
		`SELECT regions.id, COUNT(names.id) AS name_count
		 FROM regions JOIN names ON names.region_id = regions.id
		 GROUP BY regions.id ORDER BY name_count DESC, regions.id LIMIT 1`,
	)
	.get() as { id: string; name_count: number } | undefined;
const sampleName = db
	.prepare("SELECT id, name, etymology FROM names WHERE etymology != '' LIMIT 1")
	.get() as { id: string; name: string; etymology: string };
/**
 * The MAX(names.updated_at) of the largest region — the value its sitemap
 * <lastmod> must equal. See the sitemap assertions below.
 */
const largestRegionNameMax = largestRegion
	? (
			db
				.prepare(
					"SELECT MAX(updated_at) AS updated_at FROM names WHERE region_id = ?",
				)
				.get(largestRegion.id) as { updated_at: string | null }
		).updated_at
	: null;
db.close();

// --- Static entry points -------------------------------------------------
for (const file of ["index.html", "404.html", "about.html"]) {
	if (!existsSync(resolve(DIST, file))) {
		fail(`missing ${file} — the site has no ${file === "index.html" ? "homepage" : file}`);
	}
}

// --- Detail pages --------------------------------------------------------
function countHtml(dir: string): number {
	const path = resolve(DIST, dir);
	if (!existsSync(path)) return 0;
	return readdirSync(path).filter((f) => f.endsWith(".html")).length;
}

const namePages = countHtml("name");
const speciesPages = countHtml("species");
const regionPages = countHtml("region");

if (namePages !== nameIds.length) {
	fail(`prerendered ${namePages} name pages, expected ${nameIds.length}`);
}
if (speciesPages !== speciesIds.length) {
	fail(
		`prerendered ${speciesPages} species pages, expected ${speciesIds.length}`,
	);
}
if (regionPages !== regionIds.length) {
	fail(`prerendered ${regionPages} region pages, expected ${regionIds.length}`);
}

// --- Content, not just file count ----------------------------------------
// A page can exist and still be an empty shell, which is the failure this
// whole exercise is about. Assert the actual data reached the HTML.
if (sampleName) {
	const samplePath = resolve(DIST, `name/${sampleName.id}.html`);
	if (!existsSync(samplePath)) {
		fail(`sample page name/${sampleName.id}.html missing`);
	} else {
		const html = readFileSync(samplePath, "utf-8");
		const body = html.slice(html.indexOf("<body"));
		const text = body
			.replace(/<script[\s\S]*?<\/script>/g, "")
			.replace(/<[^>]+>/g, " ")
			.replace(/\s+/g, " ")
			.trim();

		if (!text.includes(sampleName.name)) {
			fail(
				`name/${sampleName.id}.html does not contain its own name "${sampleName.name}" — pages are rendering as empty shells`,
			);
		}
		const etymologyStart = sampleName.etymology.slice(0, 25);
		if (etymologyStart && !text.includes(etymologyStart)) {
			fail(
				`name/${sampleName.id}.html does not contain its etymology — the SEO payload is missing`,
			);
		}
		if (!/<title>[^<]+<\/title>/.test(html)) {
			fail(`name/${sampleName.id}.html has no <title>`);
		}
	}
}

// A region page renders every one of its names, unpaginated — that is the only
// reason it is worth prerendering. If pagination ever leaks back in, the page
// still looks fine and quietly links to ten names instead of a hundred.
if (largestRegion) {
	const regionPath = resolve(DIST, `region/${largestRegion.id}.html`);
	if (!existsSync(regionPath)) {
		fail(`region/${largestRegion.id}.html missing`);
	} else {
		const html = readFileSync(regionPath, "utf-8");
		const body = html.slice(html.indexOf("<body"));
		const linked = new Set(
			[...body.matchAll(/href="\/name\/([^"]+)"/g)].map((m) => m[1]),
		);
		if (linked.size !== largestRegion.name_count) {
			fail(
				`region/${largestRegion.id}.html links ${linked.size} names, expected ${largestRegion.name_count} — ` +
					`the region table is paginating or rendering as an empty shell`,
			);
		}
	}
}

// --- Sitemap -------------------------------------------------------------
// + / and /about
const expectedUrls = nameIds.length + speciesIds.length + regionIds.length + 2;

const sitemapPath = resolve(DIST, "sitemap.xml");
if (!existsSync(sitemapPath)) {
	fail("missing sitemap.xml");
} else {
	const xml = readFileSync(sitemapPath, "utf-8");
	const urls = (xml.match(/<url>/g) ?? []).length;
	if (urls !== expectedUrls) {
		fail(`sitemap.xml lists ${urls} URLs, expected ${expectedUrls}`);
	}

	// --- lastmod ---------------------------------------------------------
	// Every entity-backed URL carries one; `/` and `/about` deliberately do
	// not (og-data-gen.ts explains why).
	const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(.*?)<\/url>/g)].map(
		([, loc, rest]) => ({
			loc,
			lastmod: /<lastmod>([^<]+)<\/lastmod>/.exec(rest)?.[1],
		}),
	);

	if (entries.length !== urls) {
		fail(
			`parsed ${entries.length} of ${urls} sitemap <url> elements — the entry format changed`,
		);
	}

	const withLastmod = entries.filter((e) => e.lastmod);
	if (withLastmod.length !== expectedUrls - 2) {
		fail(
			`${withLastmod.length} sitemap URLs carry <lastmod>, expected ${expectedUrls - 2} ` +
				`(every URL except / and /about)`,
		);
	}
	for (const entry of entries) {
		const isStatic = /\/(about)?$/.test(entry.loc);
		if (isStatic && entry.lastmod) {
			fail(`${entry.loc} carries a <lastmod>; / and /about must omit it`);
		}
	}

	// A malformed or future date is worse than no date: it is the fastest way
	// to get lastmod distrusted across the whole site.
	const today = new Date().toISOString().slice(0, 10);
	for (const { loc, lastmod } of withLastmod) {
		if (!lastmod) continue;
		if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
			fail(`${loc} has <lastmod>${lastmod}</lastmod>, expected YYYY-MM-DD`);
		} else if (Number.isNaN(Date.parse(lastmod))) {
			fail(`${loc} has an unparseable <lastmod>${lastmod}</lastmod>`);
		} else if (lastmod > today) {
			fail(`${loc} has <lastmod>${lastmod}</lastmod>, which is in the future`);
		}
	}

	// The check this whole feature exists for. A region row is only (id, name)
	// and has no timestamp of its own, so its lastmod must be the MAX over the
	// names it lists. Copying some other date here is the failure mode that
	// looks entirely healthy from the outside.
	if (largestRegion && largestRegionNameMax) {
		const expected = largestRegionNameMax.slice(0, 10);
		const entry = entries.find((e) =>
			e.loc.endsWith(`/region/${largestRegion.id}`),
		);
		if (!entry) {
			fail(`sitemap has no entry for /region/${largestRegion.id}`);
		} else if (entry.lastmod !== expected) {
			fail(
				`/region/${largestRegion.id} has <lastmod>${entry.lastmod}</lastmod> but the ` +
					`MAX(names.updated_at) over its ${largestRegion.name_count} names is ${expected} — ` +
					`region lastmod must be derived from its names, not copied from elsewhere`,
			);
		}
	}
}

// The prerender list is the same *set* of URLs as the sitemap, but plain path
// strings: vite.config.ts reads it directly. If lastmod work ever leaks objects
// into this file, Vite prerenders nothing and ships empty shells.
const prerenderPath = resolve(ROOT, ".generated/prerender-pages.json");
if (!existsSync(prerenderPath)) {
	fail("missing .generated/prerender-pages.json — og:generate did not run");
} else {
	const paths = JSON.parse(readFileSync(prerenderPath, "utf-8")) as unknown;
	if (!Array.isArray(paths)) {
		fail(".generated/prerender-pages.json is not an array");
	} else {
		if (paths.length !== expectedUrls) {
			fail(
				`.generated/prerender-pages.json holds ${paths.length} entries, expected ${expectedUrls}`,
			);
		}
		const nonString = paths.filter(
			(p) => typeof p !== "string" || !p.startsWith("/"),
		);
		if (nonString.length > 0) {
			fail(
				`.generated/prerender-pages.json holds ${nonString.length} non-path entries ` +
					`(e.g. ${JSON.stringify(nonString[0])}) — Vite expects plain path strings`,
			);
		}
	}
}

// --- Content-addressed database ------------------------------------------
// `og:generate` copies public/fish.db to public/fish-<hash>.db and bakes that
// filename into the bundle (`__FISH_DB_FILE__` in vite.config.ts). If the two
// ever disagree — a stale .generated/fish-db.json, a build that skipped
// og:generate, a pruning bug that deleted the copy — the browser fetches a URL
// that is not there, `initSqliteWasm` throws, and search is dead site-wide
// while every prerendered page still renders perfectly from the baked dataset.
// That is a total failure that looks like a healthy build, so the hash is
// recomputed here from the database itself rather than read back from the
// generator's own manifest.
const expectedHash = createHash("sha256")
	.update(readFileSync(DB_PATH))
	.digest("hex")
	.slice(0, 8);
const expectedDbFile = `fish-${expectedHash}.db`;
const hashedDbPath = resolve(DIST, expectedDbFile);

if (!existsSync(hashedDbPath)) {
	fail(
		`missing ${expectedDbFile} in dist/client — run \`pnpm og:generate\`; ` +
			`the browser has nowhere to fetch the database from`,
	);
} else if (statSync(hashedDbPath).size !== statSync(DB_PATH).size) {
	fail(
		`${expectedDbFile} does not match public/fish.db — the hashed copy is stale, ` +
			`and it is served \`immutable\` so readers would be stuck with it`,
	);
}

// Stale copies from an earlier data revision would ship, be cached forever, and
// waste 300 KB of the deploy each.
for (const entry of readdirSync(DIST)) {
	if (/^fish-[0-9a-f]+\.db$/.test(entry) && entry !== expectedDbFile) {
		fail(`stale ${entry} in dist/client — only ${expectedDbFile} should ship`);
	}
}

/** Every .js file under dist/client, at any depth. */
function collectScripts(dir: string, out: string[] = []): string[] {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const path = resolve(dir, entry.name);
		if (entry.isDirectory()) collectScripts(path, out);
		else if (entry.name.endsWith(".js")) out.push(path);
	}
	return out;
}

const scripts = collectScripts(DIST);
const referencingScripts = scripts.filter((path) =>
	readFileSync(path, "utf-8").includes(expectedDbFile),
);

if (referencingScripts.length === 0) {
	const otherHash = scripts.some((path) =>
		/fish-[0-9a-f]{8}\.db/.test(readFileSync(path, "utf-8")),
	);
	fail(
		otherHash
			? `the client bundle references a different fish-*.db than the ${expectedDbFile} that was emitted — search would 404`
			: `no client script references ${expectedDbFile} — the \`__FISH_DB_FILE__\` define did not reach the bundle, so the app is still fetching the unhashed /fish.db`,
	);
}

// --- Caching config ------------------------------------------------------
// `_headers` is ignored on any route a Pages Function handles, and
// `functions/_middleware.ts` matches `/*`. So a rule in `_headers` only does
// anything if `_routes.json` also excludes that path from the Function.
// Getting this wrong fails silently — the site works, it is just uncached —
// which is exactly the bug this pair of files was added to fix. Assert the
// coupling here instead.
const headersPath = resolve(DIST, "_headers");
const routesPath = resolve(DIST, "_routes.json");

if (!existsSync(headersPath)) {
	fail("missing _headers — static assets fall back to Pages' max-age=0 default");
}
if (!existsSync(routesPath)) {
	fail(
		"missing _routes.json — every request runs through the Function and is never edge-cached",
	);
}

if (existsSync(headersPath) && existsSync(routesPath)) {
	const routes = JSON.parse(readFileSync(routesPath, "utf-8")) as {
		version: number;
		include: string[];
		exclude: string[];
	};

	if (routes.version !== 1) fail(`_routes.json version is ${routes.version}, expected 1`);
	if (!routes.include?.includes("/*")) {
		fail("_routes.json must include /* so the middleware still runs on all HTML");
	}
	// The OG image endpoint is itself a Function; excluding it would 404 every card.
	for (const rule of routes.exclude ?? []) {
		if (rule === "/og/*" || rule === "/og" || rule === "/*") {
			fail(`_routes.json exclude "${rule}" would disable the OG image Function`);
		}
	}
	// Cloudflare's limits: 100 combined rules, 100 characters per rule.
	const allRules = [...(routes.include ?? []), ...(routes.exclude ?? [])];
	if (allRules.length > 100) {
		fail(`_routes.json has ${allRules.length} rules, Cloudflare allows 100`);
	}
	for (const rule of allRules) {
		if (rule.length > 100) fail(`_routes.json rule over 100 chars: ${rule}`);
	}

	const excluded = new Set(routes.exclude ?? []);
	const headerPaths = readFileSync(headersPath, "utf-8")
		.split("\n")
		.map((l) => l.trimEnd())
		.filter((l) => l.startsWith("/"));

	if (headerPaths.length === 0) fail("_headers defines no rules");

	for (const path of headerPaths) {
		if (!excluded.has(path)) {
			fail(
				`_headers sets rules for "${path}" but _routes.json does not exclude it — ` +
					`the Function handles that route, so the header is dropped`,
			);
		}
	}

	// The hashed database is the one path whose rules are written as a wildcard
	// (`/fish-*.db`) rather than the literal URL, because the literal changes on
	// every data deploy. The exact-string check above only proves the two files
	// agree with each other; it cannot see that the pattern still matches the
	// filename actually emitted. A rename on either side would silently drop the
	// URL back onto the Function — uncached, and `cf-cache-status: DYNAMIC`.
	// Cloudflare wildcards match any number of characters, path separators
	// included.
	const matches = (rule: string) =>
		new RegExp(
			`^${rule.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`,
		).test(`/${expectedDbFile}`);

	if (!(routes.exclude ?? []).some(matches)) {
		fail(
			`no _routes.json exclude rule matches /${expectedDbFile} — the Function ` +
				`would serve the database and drop its Cache-Control header`,
		);
	}

	// Directives that `_headers` would apply to the hashed URL: the indented
	// lines under every rule whose pattern matches it. Comments are ignored so a
	// neighbouring rule's explanatory text cannot satisfy the assertion.
	const applied: string[] = [];
	let ruleMatches = false;
	for (const raw of readFileSync(headersPath, "utf-8").split("\n")) {
		if (raw.startsWith("#") || raw.trim() === "") continue;
		if (raw.startsWith("/")) ruleMatches = matches(raw.trimEnd());
		else if (ruleMatches) applied.push(raw.trim());
	}

	const cacheControl = applied.find((line) =>
		line.toLowerCase().startsWith("cache-control:"),
	);
	if (!cacheControl) {
		fail(`no _headers rule matches /${expectedDbFile}`);
	} else if (
		!cacheControl.includes("max-age=31536000") ||
		!cacheControl.includes("immutable")
	) {
		fail(
			`_headers gives /${expectedDbFile} "${cacheControl}" — the whole point of ` +
				`hashing the filename is that it can be immutable`,
		);
	}
}

// --- Report --------------------------------------------------------------
if (errors.length > 0) {
	console.error("\n❌ Build verification FAILED:\n");
	for (const e of errors) console.error(`   • ${e}`);
	console.error(
		"\nThis usually means `.generated/` was missing when vite build ran " +
			"(run `pnpm og:generate` first), or the prerender page list came back empty.\n",
	);
	process.exit(1);
}

console.log(
	`✅ Build verified: ${namePages} name pages, ${speciesPages} species pages, ` +
		`${regionPages} region pages, ` +
		`index/about/404 present, sitemap complete with derived lastmod, ` +
		`${expectedUrls} prerender paths, sample page carries real content, ` +
		`_headers and _routes.json agree, ` +
		`${expectedDbFile} shipped and referenced by the bundle`,
);
