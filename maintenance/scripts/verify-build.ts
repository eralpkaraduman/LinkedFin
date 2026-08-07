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
		`index/about/404 present, sitemap complete, sample page carries real content`,
);
