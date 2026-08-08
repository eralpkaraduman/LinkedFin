/**
 * Build-time data generator.
 *
 * Reads fish.db with better-sqlite3 and writes:
 *
 * - `functions/og-data.json` — lookup tables for the Pages Functions middleware
 *   and the OG image endpoint (replaces the runtime D1 dependency).
 * - `public/sitemap.xml` — every indexable URL.
 * - `.generated/fish-data.json` — the whole dataset in the shape the app's
 *   `FishName`/`Relation` types describe. Vite inlines this into the *server*
 *   bundle only (see the `virtual:fish-data` plugin in vite.config.ts) so route
 *   loaders can resolve data inside the Node prerender process, where there is
 *   no browser to run sqlite-wasm in.
 * - `.generated/prerender-pages.json` — the list of paths to prerender, read by
 *   vite.config.ts. Kept as JSON so the Vite config never has to load the
 *   better-sqlite3 native module.
 * - `public/fish-<hash>.db` — a content-addressed copy of the database, plus
 *   `.generated/fish-db.json` naming it. See the "Content-addressed database"
 *   section below.
 *
 * Run: pnpm og:generate (which runs first in `pnpm build`)
 */

import Database from "better-sqlite3";
import { createHash } from "node:crypto";
import {
	copyFileSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { resolve } from "node:path";
import { getLanguageName } from "../../src/lib/language.ts";
import { SITE_ORIGIN } from "../../src/lib/site.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const DB_PATH = resolve(ROOT, "public/fish.db");
const OUT_PATH = resolve(ROOT, "functions/og-data.json");
const SITEMAP_PATH = resolve(ROOT, "public/sitemap.xml");
const GENERATED_DIR = resolve(ROOT, ".generated");
const FISH_DATA_PATH = resolve(GENERATED_DIR, "fish-data.json");
const PRERENDER_PAGES_PATH = resolve(GENERATED_DIR, "prerender-pages.json");
const PUBLIC_DIR = resolve(ROOT, "public");
const FISH_DB_MANIFEST_PATH = resolve(GENERATED_DIR, "fish-db.json");

/** Routes that exist independently of the database. */
const STATIC_PATHS = ["/", "/about"];

const db = new Database(DB_PATH, { readonly: true });

interface NameRow {
	id: string;
	name: string;
	lang: string;
	etymology: string | null;
	transliteration: string | null;
	region_name: string;
	updated_at: string | null;
}

interface SpeciesRow {
	id: string;
	scientific_name: string;
	updated_at: string | null;
}

interface NameSpeciesRow {
	species_id: string;
	name: string;
}

interface RegionRow {
	id: string;
	name: string;
	name_count: number;
}

const names: NameRow[] = db
	.prepare(
		"SELECT n.id, n.name, n.lang, n.etymology, n.transliteration, n.updated_at, r.name as region_name FROM names n JOIN regions r ON n.region_id = r.id",
	)
	.all() as NameRow[];

const species: SpeciesRow[] = db
	.prepare("SELECT id, scientific_name, updated_at FROM species")
	.all() as SpeciesRow[];

/**
 * The freshest `names.updated_at` per species and per region. Both feed
 * <lastmod> derivation below; neither belongs in og-data.json.
 */
const nameMaxBySpecies = db
	.prepare(
		"SELECT species_id AS id, MAX(updated_at) AS updated_at FROM names WHERE updated_at IS NOT NULL GROUP BY species_id",
	)
	.all() as { id: string; updated_at: string | null }[];

const nameMaxByRegion = db
	.prepare(
		"SELECT region_id AS id, MAX(updated_at) AS updated_at FROM names WHERE updated_at IS NOT NULL GROUP BY region_id",
	)
	.all() as { id: string; updated_at: string | null }[];

const namesBySpecies: NameSpeciesRow[] = db
	.prepare("SELECT species_id, name FROM names ORDER BY id")
	.all() as NameSpeciesRow[];

/**
 * Regions that actually have names. An INNER JOIN, deliberately: an empty
 * region would otherwise get a prerendered page, a sitemap entry and an
 * indexable URL listing nothing at all.
 */
const regions: RegionRow[] = db
	.prepare(
		`SELECT regions.id, regions.name, COUNT(names.id) AS name_count
		 FROM regions
		 JOIN names ON names.region_id = regions.id
		 GROUP BY regions.id, regions.name
		 ORDER BY regions.name`,
	)
	.all() as RegionRow[];

/**
 * The same projection `initDatabase()` builds in the browser: the identical
 * columns, the identical join, the identical `ORDER BY names.name` (SQLite's
 * BINARY collation both here and in sqlite-wasm, so the row order matches).
 * Prerendered HTML and the hydrated client must agree row for row.
 */
const fishNames = db
	.prepare(
		`SELECT names.id, names.name, names.lang, names.transliteration,
		        names.phonetic, names.etymology, names.measurement_unit,
		        names.measurement_min, names.measurement_max, names.species_id,
		        names.region_id, regions.name AS region, species.scientific_name,
		        species.notes AS species_notes
		 FROM names
		 JOIN species ON species.id = names.species_id
		 JOIN regions ON regions.id = names.region_id
		 ORDER BY names.name`,
	)
	.all() as Array<Record<string, unknown> & { lang: string }>;

const fishRelations = db
	.prepare("SELECT source_id, target_id, relation FROM name_relations")
	.all();

db.close();

// Build lookup maps
const namesById: Record<
	string,
	{
		name: string;
		lang: string;
		etymology: string | null;
		transliteration: string | null;
		region_name: string;
	}
> = {};
for (const n of names) {
	namesById[n.id] = {
		name: n.name,
		lang: n.lang,
		etymology: n.etymology,
		transliteration: n.transliteration,
		region_name: n.region_name,
	};
}

const speciesById: Record<string, { scientific_name: string }> = {};
for (const s of species) {
	speciesById[s.id] = { scientific_name: s.scientific_name };
}

const namesBySpeciesId: Record<string, string[]> = {};
for (const row of namesBySpecies) {
	if (!namesBySpeciesId[row.species_id]) {
		namesBySpeciesId[row.species_id] = [];
	}
	namesBySpeciesId[row.species_id].push(row.name);
}

const regionsById: Record<string, { name: string; name_count: number }> = {};
for (const r of regions) {
	regionsById[r.id] = { name: r.name, name_count: r.name_count };
}

const data = { namesById, speciesById, namesBySpeciesId, regionsById };
writeFileSync(OUT_PATH, JSON.stringify(data));
console.log(
	`Generated ${OUT_PATH} (${names.length} names, ${species.length} species, ${regions.length} regions)`,
);

/**
 * sitemap.xml — <loc> plus a derived <lastmod>.
 *
 * Google ignores <priority> and <changefreq> outright, and honours <lastmod>
 * only when it judges the values reliable, so the rule here is that a page's
 * lastmod describes *what the page renders*, not the row that happens to share
 * its id. Three of the four page types render data they do not own:
 *
 * - `/name/$id`    → `names.updated_at`. A relation edit stamps both endpoint
 *                    names, so relations are covered. Deliberately approximate
 *                    in one respect: the page also renders sibling names for
 *                    prev/next navigation, and renaming a sibling moves this
 *                    page's text without moving its `updated_at`. Chasing that
 *                    would mean a transitive dependency graph for what is only
 *                    a recrawl hint. Do not "fix" it.
 * - `/species/$id` → MAX(species.updated_at, MAX(names.updated_at) of its
 *                    names). The page lists every name of the species.
 * - `/region/$id`  → MAX(names.updated_at) over that region's names, with no
 *                    contribution from the region row: `regions` is only
 *                    (id, name), so it has no timestamp of its own and copying
 *                    one would freeze every region page at a date unrelated to
 *                    the content it shows.
 * - `/` and `/about` → no lastmod at all. `/about` is genuinely static. `/` has
 *                    a loader and does render 23 region names with counts, but
 *                    those counts move on nearly every edit, so a root lastmod
 *                    would churn constantly — and crawlers revisit a site root
 *                    frequently regardless.
 *
 * Dates are emitted date-only (`YYYY-MM-DD`), which is valid W3C Datetime and
 * is as precise as this data honestly is.
 */
interface SitemapEntry {
	path: string;
	/** Absent for the static pages; see above. */
	lastmod?: string;
}

const toDate = (iso: string | null | undefined): string | undefined =>
	iso ? iso.slice(0, 10) : undefined;

/** Latest of the given timestamps, ISO 8601 sorting lexicographically. */
const latest = (...values: (string | null | undefined)[]): string | undefined =>
	values.filter((v): v is string => Boolean(v)).sort().pop();

const nameMaxBySpeciesId = new Map(
	nameMaxBySpecies.map((row) => [row.id, row.updated_at]),
);
const nameMaxByRegionId = new Map(
	nameMaxByRegion.map((row) => [row.id, row.updated_at]),
);

const sitemapEntries: SitemapEntry[] = [
	...STATIC_PATHS.map((path) => ({ path })),
	...names.map((n) => ({
		path: `/name/${n.id}`,
		lastmod: toDate(n.updated_at),
	})),
	...species.map((s) => ({
		path: `/species/${s.id}`,
		lastmod: toDate(latest(s.updated_at, nameMaxBySpeciesId.get(s.id))),
	})),
	...regions.map((r) => ({
		path: `/region/${r.id}`,
		lastmod: toDate(nameMaxByRegionId.get(r.id)),
	})),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
	.map(
		({ path, lastmod }) =>
			`\t<url><loc>${SITE_ORIGIN}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`,
	)
	.join("\n")}
</urlset>
`;

writeFileSync(SITEMAP_PATH, sitemap);
console.log(
	`Generated ${SITEMAP_PATH} (${sitemapEntries.length} URLs, ${sitemapEntries.filter((e) => e.lastmod).length} with lastmod)`,
);

/**
 * Prerender inputs.
 *
 * `sitemapEntries` and the prerender list are deliberately the same set: a URL
 * we advertise in the sitemap but never prerender would be served as an empty
 * shell to a crawler.
 *
 * They are the same *set*, not the same value. The prerender list's consumer
 * (vite.config.ts) reads plain path strings, so the entries are projected back
 * down to `.path` here. Writing `sitemapEntries` straight out would hand Vite
 * an array of objects and silently prerender nothing.
 */
mkdirSync(GENERATED_DIR, { recursive: true });

writeFileSync(
	FISH_DATA_PATH,
	JSON.stringify({
		names: fishNames.map((n) => ({ ...n, language: getLanguageName(n.lang) })),
		relations: fishRelations,
	}),
);
console.log(
	`Generated ${FISH_DATA_PATH} (${fishNames.length} names, ${fishRelations.length} relations)`,
);

const prerenderPaths = sitemapEntries.map((entry) => entry.path);
writeFileSync(PRERENDER_PAGES_PATH, JSON.stringify(prerenderPaths));
console.log(
	`Generated ${PRERENDER_PAGES_PATH} (${prerenderPaths.length} paths)`,
);

/**
 * Content-addressed database.
 *
 * `public/fish.db` is ~300 KB and every visitor who uses the search downloads
 * it. Its URL cannot be cached beyond an ETag revalidation, because the
 * filename is stable while the bytes are rewritten on every data deploy — a
 * long max-age would pin readers to a stale database. Copying it to a name that
 * contains a digest of its own bytes removes that hazard: that URL's contents
 * can never change, so `_headers` can hand it the same
 * `max-age=31536000, immutable` that `/assets/*` gets.
 *
 * Why `public/` and not `dist/client` after the build:
 *
 * - Vite copies `public/` verbatim into `dist/client`, so the file needs no
 *   copy step, no emit plugin, and no ordering rule against the prerender.
 * - `vite dev` and `vite preview` serve `public/` too, so the hashed URL
 *   resolves in development exactly as it does in production. Emitting only
 *   into `dist/client` would 404 that URL under `vite dev`, forcing a
 *   dev-only fallback branch in `src/lib/database.ts` — a divergence between
 *   environments in the one code path that must not have one.
 * - This script already writes a build artefact into `public/`
 *   (`sitemap.xml`), so the precedent and the .gitignore entry pattern exist.
 *
 * The tracked, unhashed `public/fish.db` stays exactly where it is and stays
 * deployed: it is the repo's single source of truth (see AGENTS.md), every
 * maintenance script opens it by that path, and it is a URL that has been
 * public long enough that something may link to it. It keeps its
 * `must-revalidate` rule; only the app moves to the hashed copy.
 */
const dbBytes = readFileSync(DB_PATH);
const dbHash = createHash("sha256").update(dbBytes).digest("hex").slice(0, 8);
const fishDbFile = `fish-${dbHash}.db`;

// Previous runs' copies would otherwise pile up in public/ and ship in every
// deploy. Only the current hash survives.
for (const entry of readdirSync(PUBLIC_DIR)) {
	if (/^fish-[0-9a-f]+\.db$/.test(entry) && entry !== fishDbFile) {
		rmSync(resolve(PUBLIC_DIR, entry));
	}
}

copyFileSync(DB_PATH, resolve(PUBLIC_DIR, fishDbFile));
writeFileSync(
	FISH_DB_MANIFEST_PATH,
	JSON.stringify({ file: fishDbFile, hash: dbHash }),
);
console.log(
	`Generated public/${fishDbFile} (${(dbBytes.length / 1024).toFixed(0)} KB) and ${FISH_DB_MANIFEST_PATH}`,
);
