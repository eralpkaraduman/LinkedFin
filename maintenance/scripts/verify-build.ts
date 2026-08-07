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
import { existsSync, readFileSync, readdirSync } from "node:fs";
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
const sampleName = db
	.prepare("SELECT id, name, etymology FROM names WHERE etymology != '' LIMIT 1")
	.get() as { id: string; name: string; etymology: string };
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

if (namePages !== nameIds.length) {
	fail(`prerendered ${namePages} name pages, expected ${nameIds.length}`);
}
if (speciesPages !== speciesIds.length) {
	fail(
		`prerendered ${speciesPages} species pages, expected ${speciesIds.length}`,
	);
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

// --- Sitemap -------------------------------------------------------------
const sitemapPath = resolve(DIST, "sitemap.xml");
if (!existsSync(sitemapPath)) {
	fail("missing sitemap.xml");
} else {
	const urls = (readFileSync(sitemapPath, "utf-8").match(/<url>/g) ?? []).length;
	const expected = nameIds.length + speciesIds.length + 2; // + / and /about
	if (urls !== expected) {
		fail(`sitemap.xml lists ${urls} URLs, expected ${expected}`);
	}
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
		`index/about/404 present, sitemap complete, sample page carries real content, ` +
		`_headers and _routes.json agree`,
);
