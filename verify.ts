import { Database } from "bun:sqlite";
import { readFileSync } from "fs";

const db = new Database("fish.db");

// Get all data from DB
const species = db.query("SELECT * FROM species ORDER BY id").all();
const regions = db.query("SELECT * FROM regions ORDER BY id").all();
const names = db.query(`
  SELECT
    n.*,
    s.scientific_name,
    r.name as region_name
  FROM names n
  JOIN species s ON n.species_id = s.id
  JOIN regions r ON n.region_id = r.id
  ORDER BY s.scientific_name, n.id
`).all();

console.log("=".repeat(80));
console.log("DATABASE CONTENTS");
console.log("=".repeat(80));

console.log(`\n### SPECIES (${species.length} total) ###\n`);
for (const s of species) {
  console.log(`${s.id}: ${s.scientific_name}`);
  console.log(`   Notes: ${s.notes || "(none)"}`);
}

console.log(`\n### REGIONS (${regions.length} total) ###\n`);
for (const r of regions) {
  console.log(`${r.id}: ${r.name} (${r.language})${r.parent_region ? ` [parent: ${r.parent_region}]` : ""}`);
}

console.log(`\n### NAMES (${names.length} total) ###\n`);
let currentSpecies = "";
for (const n of names) {
  if (n.scientific_name !== currentSpecies) {
    currentSpecies = n.scientific_name;
    console.log(`\n--- ${currentSpecies} ---`);
  }
  const measurement = n.measurement_unit
    ? ` [${n.measurement_min}-${n.measurement_max ?? "∞"} ${n.measurement_unit}]`
    : "";
  const flags = [
    n.native ? "NATIVE" : "",
    n.disputed ? "DISPUTED" : "",
  ].filter(Boolean).join(", ");

  console.log(`  ${n.name} (${n.region_name})${measurement}${flags ? ` {${flags}}` : ""}`);
  if (n.etymology) console.log(`    Etymology: ${n.etymology}`);
}

// Cross-check with JSONL
console.log("\n" + "=".repeat(80));
console.log("CROSS-CHECK WITH JSONL");
console.log("=".repeat(80));

const jsonl = readFileSync("fish_database.jsonl", "utf-8");
const records = jsonl.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));

// Count names in JSONL
let jsonlNameCount = 0;
const jsonlSpecies = new Set<string>();
for (const record of records) {
  jsonlSpecies.add(record.scientific_name);
  jsonlNameCount += record.names.length;
}

console.log(`\nJSONL: ${jsonlSpecies.size} species, ${jsonlNameCount} names`);
console.log(`DB:    ${species.length} species, ${names.length} names`);

// Check each JSONL name exists in DB
console.log("\n### Checking each JSONL name exists in DB ###\n");
let missing = 0;
for (const record of records) {
  for (const nameEntry of record.names) {
    const found = names.find(
      (n) => n.name === nameEntry.name && n.scientific_name === record.scientific_name
    );
    if (!found) {
      console.log(`MISSING: ${nameEntry.name} (${record.scientific_name})`);
      missing++;
    }
  }
}

if (missing === 0) {
  console.log("✓ All JSONL names found in DB");
} else {
  console.log(`\n✗ ${missing} names missing from DB`);
}

// Check for duplicate names in DB (same name + same species)
console.log("\n### Checking for duplicates in DB ###\n");
const dupes = db.query(`
  SELECT name, species_id, COUNT(*) as count
  FROM names
  GROUP BY name, species_id
  HAVING count > 1
`).all();

if (dupes.length === 0) {
  console.log("✓ No duplicate name+species combinations");
} else {
  console.log("Duplicates found:");
  console.table(dupes);
}

db.close();
