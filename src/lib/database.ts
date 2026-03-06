import sqlite3InitModule from "@sqlite.org/sqlite-wasm"
import type { FishName, Relation } from "./types"

let allNames: FishName[] = []
let allRelations: Relation[] = []
let initialized = false

// Language display names with overrides for Intl.DisplayNames gaps
const langDisplayNames = new Intl.DisplayNames(["en"], { type: "language" })
const langOverrides: Record<string, string> = {
  arb: "Standard Arabic",
  apc: "Levantine Arabic",
  grc: "Ancient Greek",
}

function getLangName(code: string): string {
  return langOverrides[code] || langDisplayNames.of(code) || code
}

export async function initDatabase(
  onProgress?: (message: string) => void
): Promise<void> {
  if (initialized) return

  const report = onProgress || (() => {})

  report("Loading SQLite WASM...")
  const sqlite3 = await sqlite3InitModule()

  report("Fetching database...")
  const dbPath = import.meta.env.BASE_URL + "fish.db"
  const response = await fetch(dbPath)
  if (!response.ok) {
    throw new Error(`Failed to fetch database: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  report("Initializing database...")
  const p = sqlite3.wasm.allocFromTypedArray(bytes)
  const db = new sqlite3.oo1.DB()
  const dbPtr = db.pointer
  if (!dbPtr) {
    throw new Error("Failed to initialize database: null pointer")
  }
  sqlite3.capi.sqlite3_deserialize(
    dbPtr,
    "main",
    p,
    bytes.length,
    bytes.length,
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
      sqlite3.capi.SQLITE_DESERIALIZE_READONLY
  )

  // Load all names
  const rawNames = db.exec({
    sql: `SELECT n.id, n.name, n.lang, n.transliteration, n.phonetic,
                 n.etymology, n.measurement_unit, n.measurement_min, n.measurement_max,
                 n.species_id, r.name as region, s.scientific_name, s.notes as species_notes
          FROM names n
          JOIN species s ON n.species_id = s.id
          JOIN regions r ON n.region_id = r.id
          ORDER BY n.name`,
    returnValue: "resultRows",
    rowMode: "object",
  }) as unknown as Omit<FishName, "language">[]

  // Add computed language field
  allNames = rawNames.map((n) => ({
    ...n,
    language: getLangName(n.lang),
  }))

  // Load all relations
  allRelations = db.exec({
    sql: `SELECT source_id, target_id, relation FROM name_relations`,
    returnValue: "resultRows",
    rowMode: "object",
  }) as unknown as Relation[]

  initialized = true
  report(`Ready! ${allNames.length} names loaded.`)
}

export function getNames(): FishName[] {
  return allNames
}

export function getRelations(): Relation[] {
  return allRelations
}

export function getNameById(id: string): FishName | undefined {
  return allNames.find((n) => n.id === id)
}

export function getNamesBySpecies(speciesId: string): FishName[] {
  return allNames.filter((n) => n.species_id === speciesId)
}

export function isInitialized(): boolean {
  return initialized
}
