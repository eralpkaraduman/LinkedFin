import sqlite3InitModule, { Database } from "@sqlite.org/sqlite-wasm";

// Re-export types from generated schema for use in maintenance scripts
export type { Species, Names, Regions, NameRelations } from "../../src/db/types";

// Type aliases for backwards compatibility
export type Name = import("../../src/db/types").Names;
export type Region = import("../../src/db/types").Regions;
export type NameRelation = import("../../src/db/types").NameRelations;

let db: Database | null = null;

export async function initDb(): Promise<Database> {
  if (db) return db;

  const sqlite3 = await sqlite3InitModule();

  // Fetch the database file
  const response = await fetch("/fish.db");
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Create database from bytes
  const p = sqlite3.wasm.allocFromTypedArray(bytes);
  db = new sqlite3.oo1.DB();
  const rc = sqlite3.capi.sqlite3_deserialize(
    db.pointer!,
    "main",
    p,
    bytes.length,
    bytes.length,
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
      sqlite3.capi.SQLITE_DESERIALIZE_READONLY
  );

  if (rc !== 0) {
    throw new Error(`Failed to deserialize database: ${rc}`);
  }

  return db;
}

export function query<T>(sql: string, params: unknown[] = []): T[] {
  if (!db) throw new Error("Database not initialized");
  return db.exec({ sql, bind: params, returnValue: "resultRows", rowMode: "object" }) as T[];
}

// Convenience queries
export const queries = {
  allSpecies: () => query<Species>("SELECT * FROM species ORDER BY scientific_name"),

  allRegions: () => query<Region>("SELECT * FROM regions ORDER BY name"),

  namesForSpecies: (speciesId: string) =>
    query<Name & { region_name: string }>(
      `SELECT n.*, r.name as region_name
       FROM names n
       JOIN regions r ON n.region_id = r.id
       WHERE n.species_id = ?
       ORDER BY r.language`,
      [speciesId]
    ),

  searchByName: (term: string) =>
    query<Name & { scientific_name: string; region_name: string }>(
      `SELECT n.*, s.scientific_name, r.name as region_name
       FROM names n
       JOIN species s ON n.species_id = s.id
       JOIN regions r ON n.region_id = r.id
       WHERE n.name LIKE ?
       ORDER BY n.name`,
      [`%${term}%`]
    ),

};
