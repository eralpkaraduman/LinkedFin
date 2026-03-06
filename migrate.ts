import { Database } from "bun:sqlite";
import { readFileSync } from "fs";

// Create database
const db = new Database("fish.db");

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS species (
    id TEXT PRIMARY KEY,
    scientific_name TEXT UNIQUE NOT NULL,
    family TEXT,
    habitat TEXT DEFAULT 'marine',
    notes TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS regions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    name_local TEXT,
    language TEXT NOT NULL,
    parent_region TEXT REFERENCES regions(id),
    polygon TEXT,
    notes TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS names (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    species_id TEXT NOT NULL REFERENCES species(id),
    region_id TEXT NOT NULL REFERENCES regions(id),
    etymology TEXT,
    native INTEGER DEFAULT 0,
    disputed INTEGER DEFAULT 0,
    measurement_unit TEXT,
    measurement_min REAL,
    measurement_max REAL,
    notes TEXT
  )
`);

// Create indexes
db.run(`CREATE INDEX IF NOT EXISTS idx_names_species ON names(species_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_names_region ON names(region_id)`);
db.run(`CREATE INDEX IF NOT EXISTS idx_names_name ON names(name)`);

// Insert regions
const regions = [
  { id: "turkish-aegean", name: "Turkish Aegean", name_local: "Ege", language: "Turkish", notes: "Western Turkish coast, Greek linguistic influence" },
  { id: "turkish-marmara", name: "Turkish Marmara", name_local: "Marmara", language: "Turkish", notes: "Sea of Marmara, Bosphorus, Istanbul fishing tradition" },
  { id: "turkish-blacksea", name: "Turkish Black Sea", name_local: "Karadeniz", language: "Turkish", notes: "Northern Turkish coast" },
  { id: "turkish-inland", name: "Turkish Inland", name_local: "İç Anadolu", language: "Turkish", notes: "Freshwater lakes and rivers" },
  { id: "greek", name: "Greece", name_local: "Ελλάδα", language: "Greek", notes: "Greece and Greek islands" },
  { id: "arabic", name: "Arab World", name_local: "العالم العربي", language: "Arabic", notes: "General Arabic, no specific region" },
  { id: "arabic-levant", name: "Levant", name_local: "المشرق", language: "Arabic", parent_region: "arabic", notes: "Syria, Lebanon, Palestine, Jordan" },
  { id: "arabic-egypt", name: "Egypt", name_local: "مصر", language: "Arabic", parent_region: "arabic", notes: "Egyptian coast" },
  { id: "international", name: "International", name_local: null, language: "English", notes: "International/scientific naming" },
];

const insertRegion = db.prepare(`
  INSERT OR IGNORE INTO regions (id, name, name_local, language, parent_region, notes)
  VALUES ($id, $name, $name_local, $language, $parent_region, $notes)
`);

for (const r of regions) {
  insertRegion.run({
    $id: r.id,
    $name: r.name,
    $name_local: r.name_local,
    $language: r.language,
    $parent_region: r.parent_region || null,
    $notes: r.notes,
  });
}

// Read existing JSONL
const jsonl = readFileSync("fish_database.jsonl", "utf-8");
const records = jsonl.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));

// Build species map (dedupe by scientific_name)
const speciesMap = new Map<string, { scientific_name: string; notes: string[] }>();

for (const record of records) {
  const sci = record.scientific_name;
  if (!speciesMap.has(sci)) {
    speciesMap.set(sci, { scientific_name: sci, notes: [] });
  }
  if (record.notes) {
    speciesMap.get(sci)!.notes.push(record.notes);
  }
}

// Insert species
const insertSpecies = db.prepare(`
  INSERT OR IGNORE INTO species (id, scientific_name, notes)
  VALUES ($id, $scientific_name, $notes)
`);

const speciesIdMap = new Map<string, string>();
let speciesCounter = 1;

for (const [sci, data] of speciesMap) {
  const id = `sp_${String(speciesCounter++).padStart(3, "0")}`;
  speciesIdMap.set(sci, id);

  // Combine notes, remove duplicates
  const uniqueNotes = [...new Set(data.notes)].join(" ");

  insertSpecies.run({
    $id: id,
    $scientific_name: sci,
    $notes: uniqueNotes || null,
  });
}

// Region ID mapping from old format
function mapRegion(oldRegion: string): string {
  const mapping: Record<string, string> = {
    "Turkish-Aegean": "turkish-aegean",
    "Turkish-Marmara": "turkish-marmara",
    "Turkish-BlackSea": "turkish-blacksea",
    "Turkish-Inland": "turkish-inland",
    "Greek": "greek",
    "Arabic": "arabic",
    "Arabic-Levant": "arabic-levant",
    "Arabic-Egypt": "arabic-egypt",
    "International": "international",
  };
  return mapping[oldRegion] || "international";
}

// Insert names
const insertName = db.prepare(`
  INSERT INTO names (id, name, species_id, region_id, etymology, native, disputed, measurement_unit, measurement_min, measurement_max, notes)
  VALUES ($id, $name, $species_id, $region_id, $etymology, $native, $disputed, $measurement_unit, $measurement_min, $measurement_max, $notes)
`);

let nameCounter = 1;

for (const record of records) {
  const speciesId = speciesIdMap.get(record.scientific_name)!;
  const measurement = record.measurement;

  for (const nameEntry of record.names) {
    const id = `nm_${String(nameCounter++).padStart(4, "0")}`;
    const regionId = mapRegion(nameEntry.region);

    // Detect native/disputed from etymology
    const etymology = nameEntry.etymology || "";
    const isNative = etymology.toLowerCase().includes("native turkish") || etymology.toLowerCase().includes("old turkish");
    const isDisputed = etymology.toUpperCase().includes("DISPUTED");

    // Clean etymology (remove prefixes)
    let cleanEtymology = etymology
      .replace(/^Native Turkish:\s*/i, "")
      .replace(/^DISPUTED:\s*/i, "");

    insertName.run({
      $id: id,
      $name: nameEntry.name,
      $species_id: speciesId,
      $region_id: regionId,
      $etymology: cleanEtymology || null,
      $native: isNative ? 1 : 0,
      $disputed: isDisputed ? 1 : 0,
      $measurement_unit: measurement?.unit || null,
      $measurement_min: measurement?.value_range?.[0] ?? null,
      $measurement_max: measurement?.value_range?.[1] ?? null,
      $notes: null,
    });
  }
}

console.log("Migration complete!");
console.log(`Species: ${speciesMap.size}`);
console.log(`Names: ${nameCounter - 1}`);
console.log(`Regions: ${regions.length}`);

db.close();
