/**
 * Build-time OG metadata generator.
 *
 * Reads fish.db with better-sqlite3 and writes functions/og-data.json
 * containing static lookup tables used by the Pages Functions middleware
 * and OG image endpoint — replacing the runtime D1 dependency.
 *
 * Run: pnpm og:generate
 */

import Database from "better-sqlite3";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DB_PATH = resolve(import.meta.dirname, "../../public/fish.db");
const OUT_PATH = resolve(import.meta.dirname, "../../functions/og-data.json");

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
