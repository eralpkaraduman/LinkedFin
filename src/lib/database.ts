import { Kysely } from "kysely";
import {
	createSqliteWasmDialect,
	initSqliteWasm,
} from "../db/sqlite-wasm-dialect";
import type { DB } from "../db/types";
import { getLanguageName } from "./language";
import type { FishName, Relation } from "./types";

let db: Kysely<DB> | null = null;
let allNames: FishName[] = [];
let allRelations: Relation[] = [];
let initialized = false;

export async function initDatabase(
	onProgress?: (message: string) => void,
): Promise<void> {
	if (initialized) return;

	const report = onProgress || (() => {});

	// Initialize SQLite WASM and create Kysely instance
	const dbPath = `${import.meta.env.BASE_URL}fish.db`;
	const sqliteDb = await initSqliteWasm(dbPath, report);
	const dialect = createSqliteWasmDialect(sqliteDb);
	db = new Kysely<DB>({ dialect });

	report("Loading data...");

	// Load all names using Kysely query builder - fully type-safe!
	const rawNames = await db
		.selectFrom("names")
		.innerJoin("species", "species.id", "names.species_id")
		.innerJoin("regions", "regions.id", "names.region_id")
		.select([
			"names.id",
			"names.name",
			"names.lang",
			"names.transliteration",
			"names.phonetic",
			"names.etymology",
			"names.measurement_unit",
			"names.measurement_min",
			"names.measurement_max",
			"names.species_id",
			"regions.name as region",
			"species.scientific_name",
			"species.notes as species_notes",
		])
		.orderBy("names.name")
		.execute();

	// Add computed language field
	allNames = rawNames.map((n) => ({
		...n,
		language: getLanguageName(n.lang),
	}));

	// Load all relations using Kysely query builder
	const rawRelations = await db
		.selectFrom("name_relations")
		.select(["source_id", "target_id", "relation"])
		.execute();

	// Cast relation string to RelationType (Kysely returns string from DB)
	allRelations = rawRelations as Relation[];

	initialized = true;
	report(`Ready! ${allNames.length} names loaded.`);
}

export function getNames(): FishName[] {
	return allNames;
}

export function getRelations(): Relation[] {
	return allRelations;
}

export function getNameById(id: string): FishName | undefined {
	return allNames.find((n) => n.id === id);
}

export function getNamesBySpecies(speciesId: string): FishName[] {
	return allNames.filter((n) => n.species_id === speciesId);
}

export function isInitialized(): boolean {
	return initialized;
}

export function getSpeciesInfo(
	speciesId: string,
): { scientific_name: string; notes?: string } | undefined {
	const name = allNames.find((n) => n.species_id === speciesId);
	if (!name) return undefined;
	return {
		scientific_name: name.scientific_name,
		notes: name.species_notes ?? undefined,
	};
}
