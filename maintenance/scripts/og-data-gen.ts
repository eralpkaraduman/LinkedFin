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
}

interface SpeciesRow {
	id: string;
	scientific_name: string;
}

interface NameSpeciesRow {
	species_id: string;
	name: string;
}

const names: NameRow[] = db
	.prepare(
		"SELECT n.id, n.name, n.lang, n.etymology, n.transliteration, r.name as region_name FROM names n JOIN regions r ON n.region_id = r.id",
	)
	.all() as NameRow[];

const species: SpeciesRow[] = db
	.prepare("SELECT id, scientific_name FROM species")
	.all() as SpeciesRow[];

const namesBySpecies: NameSpeciesRow[] = db
	.prepare("SELECT species_id, name FROM names ORDER BY id")
	.all() as NameSpeciesRow[];

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
		        regions.name AS region, species.scientific_name,
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

const data = { namesById, speciesById, namesBySpeciesId };
writeFileSync(OUT_PATH, JSON.stringify(data));
console.log(
	`Generated ${OUT_PATH} (${names.length} names, ${species.length} species)`,
);

/**
 * sitemap.xml — <loc> only, deliberately.
 *
 * Google ignores <priority> and <changefreq> outright, and honours <lastmod>
 * only when it is reliable. Neither table carries a real per-row timestamp, so
 * the only lastmod available would be the build time, identical across every
 * URL on every deploy — the classic way to get lastmod distrusted site-wide.
 * Omitting it is better than faking it. Add real values once names/species
 * carry updated_at.
 */
const sitemapPaths = [
	...STATIC_PATHS,
	...names.map((n) => `/name/${n.id}`),
	...species.map((s) => `/species/${s.id}`),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((path) => `\t<url><loc>${SITE_ORIGIN}${path}</loc></url>`).join("\n")}
</urlset>
`;

writeFileSync(SITEMAP_PATH, sitemap);
console.log(`Generated ${SITEMAP_PATH} (${sitemapPaths.length} URLs)`);

/**
 * Prerender inputs.
 *
 * `sitemapPaths` and the prerender list are deliberately the same set: a URL we
 * advertise in the sitemap but never prerender would be served as an empty
 * shell to a crawler.
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

writeFileSync(PRERENDER_PAGES_PATH, JSON.stringify(sitemapPaths));
console.log(`Generated ${PRERENDER_PAGES_PATH} (${sitemapPaths.length} paths)`);

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
