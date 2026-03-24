import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

// ============================================================================
// ADD ANCIENT GREEK ΓΟΓΓΡΟΣ NAME FOR CONGER
// Fixes GitHub Issue #17 - TREK-531
// ============================================================================

console.log("=== Adding Ancient Greek γόγγρος (góngros) for Conger ===\n");

// ----------------------------------------------------------------------------
// 1. ADD ANCIENT GREEK NAME
// nm_0465 (Italian Grongo) and nm_0338 (English European conger) both
// reference Greek γόγγρος (góngros) in their etymology, but that Ancient Greek
// name record doesn't exist in the database.
// ----------------------------------------------------------------------------

console.log("1. Adding Ancient Greek name...");

db.run(`
  INSERT OR IGNORE INTO names (
    id, name, species_id, region_id, lang,
    etymology, transliteration, phonetic, notes
  ) VALUES (
    'nm_0475',
    'γόγγρος',
    'sp_075',
    'ancient-greece',
    'grc',
    'From Ancient Greek γόγγρος góngros (conger eel)
↳ Etymology uncertain, possibly onomatopoeic from grunting sound',
    'gongros',
    '/ɡóŋ.ɡros/',
    'Source of Latin conger and modern Italian grongo. Attested in Aristotle.'
  )
`);
console.log("  - nm_0475: γόγγρος (Ancient Greek, sp_075 - Conger conger)");

// ----------------------------------------------------------------------------
// 2. ADD BORROWED_FROM RELATIONS
// Italian Grongo → Ancient Greek γόγγρος (via Latin conger)
// English European conger → Ancient Greek γόγγρος (via Latin conger)
// ----------------------------------------------------------------------------

console.log("\n2. Adding borrowed_from relations...");

const relations: { source_id: string; target_id: string; notes: string }[] = [
  {
    source_id: "nm_0465", // Italian Grongo
    target_id: "nm_0475", // Ancient Greek γόγγρος
    notes: "Italian grongo from Latin conger, from Ancient Greek γόγγρος",
  },
  {
    source_id: "nm_0338", // English European conger
    target_id: "nm_0475", // Ancient Greek γόγγρος
    notes: "English conger from Latin conger, from Ancient Greek γόγγρος",
  },
];

const insertRelation = db.prepare(`
  INSERT OR IGNORE INTO name_relations (source_id, target_id, relation, notes)
  VALUES ($source_id, $target_id, 'borrowed_from', $notes)
`);

for (const rel of relations) {
  insertRelation.run({
    $source_id: rel.source_id,
    $target_id: rel.target_id,
    $notes: rel.notes,
  });
  console.log(`  - ${rel.source_id} → ${rel.target_id}: borrowed_from`);
}

// ----------------------------------------------------------------------------
// 3. VERIFICATION
// ----------------------------------------------------------------------------

console.log("\n3. Verification...");

// Check the new name
const newName = db.query(`
  SELECT n.id, n.name, n.transliteration, s.scientific_name, r.name as region
  FROM names n
  JOIN species s ON n.species_id = s.id
  JOIN regions r ON n.region_id = r.id
  WHERE n.id = 'nm_0475'
`).get() as { id: string; name: string; transliteration: string; scientific_name: string; region: string };

console.log(`  - New name: ${newName.id} - ${newName.name} (${newName.transliteration}) for ${newName.scientific_name} in ${newName.region}`);

// Check all names for Conger conger
console.log("\n  All names for Conger conger (sp_075):");
const congerNames = db.query(`
  SELECT n.id, n.name, n.lang, r.name as region
  FROM names n
  JOIN regions r ON n.region_id = r.id
  WHERE n.species_id = 'sp_075'
  ORDER BY n.id
`).all() as { id: string; name: string; lang: string; region: string }[];

for (const nm of congerNames) {
  console.log(`    - ${nm.id}: ${nm.name} (${nm.lang}) - ${nm.region}`);
}

// Check relations for Conger conger names
console.log("\n  Relations for Conger conger names:");
const congerRelations = db.query(`
  SELECT n1.name as source, r.relation, n2.name as target, r.notes
  FROM name_relations r
  JOIN names n1 ON r.source_id = n1.id
  JOIN names n2 ON r.target_id = n2.id
  WHERE n1.species_id = 'sp_075' OR n2.species_id = 'sp_075'
`).all() as { source: string; relation: string; target: string; notes: string }[];

for (const rel of congerRelations) {
  console.log(`    - ${rel.source} → ${rel.target} (${rel.relation})`);
}

db.close();

console.log("\n=== Migration Complete ===");
console.log("\nRun these commands to finalize:");
console.log("  pnpm db:types   # Regenerate TypeScript types");
console.log("  pnpm db:copy    # Copy database to public folder");
