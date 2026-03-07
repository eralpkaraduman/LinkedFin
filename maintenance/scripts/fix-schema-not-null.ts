/**
 * Fix SQLite schema to add NOT NULL constraints to primary key columns.
 * SQLite TEXT PRIMARY KEY doesn't automatically imply NOT NULL.
 * This migration rebuilds tables with explicit NOT NULL on id columns.
 */

import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Disable foreign keys during migration
db.run("PRAGMA foreign_keys = OFF");

console.log("Starting schema migration to add NOT NULL constraints...\n");

// Fix 'names' table
console.log("Rebuilding 'names' table...");
db.run(`
  CREATE TABLE names_new (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    species_id TEXT NOT NULL REFERENCES species(id),
    region_id TEXT NOT NULL REFERENCES regions(id),
    lang TEXT,
    etymology TEXT,
    transliteration TEXT,
    phonetic TEXT,
    measurement_unit TEXT,
    measurement_min REAL,
    measurement_max REAL,
    notes TEXT
  )
`);
db.run(`INSERT INTO names_new SELECT id, name, species_id, region_id, lang, etymology, transliteration, phonetic, measurement_unit, measurement_min, measurement_max, notes FROM names`);
db.run(`DROP TABLE names`);
db.run(`ALTER TABLE names_new RENAME TO names`);
db.run(`CREATE INDEX idx_names_species ON names(species_id)`);
db.run(`CREATE INDEX idx_names_region ON names(region_id)`);
db.run(`CREATE INDEX idx_names_name ON names(name)`);
console.log("  ✓ names table rebuilt with id NOT NULL");

// Fix 'species' table
console.log("Rebuilding 'species' table...");
db.run(`
  CREATE TABLE species_new (
    id TEXT PRIMARY KEY NOT NULL,
    scientific_name TEXT UNIQUE NOT NULL,
    family TEXT,
    habitat TEXT DEFAULT 'marine',
    notes TEXT
  )
`);
db.run(`INSERT INTO species_new SELECT * FROM species`);
db.run(`DROP TABLE species`);
db.run(`ALTER TABLE species_new RENAME TO species`);
console.log("  ✓ species table rebuilt with id NOT NULL");

// Fix 'regions' table
console.log("Rebuilding 'regions' table...");
db.run(`
  CREATE TABLE regions_new (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    name_local TEXT,
    language TEXT NOT NULL,
    parent_region TEXT REFERENCES regions(id),
    polygon TEXT,
    notes TEXT
  )
`);
db.run(`INSERT INTO regions_new SELECT * FROM regions`);
db.run(`DROP TABLE regions`);
db.run(`ALTER TABLE regions_new RENAME TO regions`);
console.log("  ✓ regions table rebuilt with id NOT NULL");

// Re-enable foreign keys
db.run("PRAGMA foreign_keys = ON");

// Recreate triggers for names table
console.log("\nRecreating triggers...");
db.run(`
  CREATE TRIGGER require_transliteration_insert
  BEFORE INSERT ON names
  WHEN NEW.lang IN ('arb', 'arz', 'apc', 'ell', 'fin', 'swe', 'est') AND (NEW.transliteration IS NULL OR NEW.transliteration = '')
  BEGIN
    SELECT RAISE(ABORT, 'Transliteration required for Arabic (arb/arz/apc), Greek, Finnish, Swedish, and Estonian names');
  END
`);
db.run(`
  CREATE TRIGGER require_transliteration_update
  BEFORE UPDATE ON names
  WHEN NEW.lang IN ('arb', 'arz', 'apc', 'ell', 'fin', 'swe', 'est') AND (NEW.transliteration IS NULL OR NEW.transliteration = '')
  BEGIN
    SELECT RAISE(ABORT, 'Transliteration required for Arabic (arb/arz/apc), Greek, Finnish, Swedish, and Estonian names');
  END
`);
db.run(`
  CREATE TRIGGER check_transliteration_ascii_insert
  BEFORE INSERT ON names
  WHEN NEW.transliteration IS NOT NULL AND NEW.transliteration != '' AND NEW.transliteration GLOB '*[^a-zA-Z0-9 -]*'
  BEGIN
    SELECT RAISE(ABORT, 'transliteration must contain only ASCII letters, numbers, spaces, and hyphens');
  END
`);
db.run(`
  CREATE TRIGGER check_transliteration_ascii_update
  BEFORE UPDATE ON names
  WHEN NEW.transliteration IS NOT NULL AND NEW.transliteration != '' AND NEW.transliteration GLOB '*[^a-zA-Z0-9 -]*'
  BEGIN
    SELECT RAISE(ABORT, 'transliteration must contain only ASCII letters, numbers, spaces, and hyphens');
  END
`);
console.log("  ✓ triggers recreated");

// Verify
console.log("\nVerifying schema...");
const namesSchema = db.query("SELECT sql FROM sqlite_master WHERE name = 'names'").get() as { sql: string };
const speciesSchema = db.query("SELECT sql FROM sqlite_master WHERE name = 'species'").get() as { sql: string };
const regionsSchema = db.query("SELECT sql FROM sqlite_master WHERE name = 'regions'").get() as { sql: string };

console.log("\nnames:", namesSchema.sql.includes("NOT NULL") ? "✓ has NOT NULL" : "✗ missing NOT NULL");
console.log("species:", speciesSchema.sql.includes("NOT NULL") ? "✓ has NOT NULL" : "✗ missing NOT NULL");
console.log("regions:", regionsSchema.sql.includes("NOT NULL") ? "✓ has NOT NULL" : "✗ missing NOT NULL");

// Integrity check
console.log("\nRunning integrity check...");
const integrity = db.query("PRAGMA integrity_check").get() as { integrity_check: string };
console.log("Integrity:", integrity.integrity_check);

db.close();
console.log("\n✓ Migration complete!");
