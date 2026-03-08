import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// ============================================================================
// ITALIAN FISH NAMES MIGRATION
// Based on research from TREK-514 to TREK-522
// ============================================================================

console.log("=== Italian Names Migration ===\n");

// ----------------------------------------------------------------------------
// 1. FIX INCORRECT ETYMOLOGIES
// These entries incorrectly claim Italian origin
// ----------------------------------------------------------------------------

console.log("1. Fixing incorrect etymologies...");

// nm_0133: Minekop - NOT from Italian, from Greek μυλοκόπι (mill-striker)
db.run(`
  UPDATE names SET etymology = 'From Greek μυλοκόπι mylokópi (mill-striker)
↳ From μύλος (mill) + κόπτω (to strike)'
  WHERE id = 'nm_0133'
`);
console.log("  - nm_0133 (Minekop): Fixed etymology - Greek origin, not Italian");

// nm_0260: İskorpit - NOT from Italian, from Greek σκορπίδι
db.run(`
  UPDATE names SET etymology = 'From Greek σκορπίδι skorpídi (little scorpion)
↳ From σκορπιός (scorpion)'
  WHERE id = 'nm_0260'
`);
console.log("  - nm_0260 (İskorpit): Fixed etymology - Greek origin, not Italian");

// nm_0322: Μούγκρι - NOT from Italian, Greek onomatopoeia
db.run(`
  UPDATE names SET etymology = 'Greek onomatopoeia from μουγκρίζω moungrízo (to bellow/grunt)'
  WHERE id = 'nm_0322'
`);
console.log("  - nm_0322 (Μούγκρι): Fixed etymology - Greek onomatopoeia, not Italian");

// Fix the relation notes for nm_0260
db.run(`
  UPDATE name_relations
  SET notes = 'İskorpit borrowed from Greek σκορπίδι'
  WHERE source_id = 'nm_0260' AND target_id = 'nm_0262'
`);
console.log("  - Fixed relation notes for nm_0260 → nm_0262");

// ----------------------------------------------------------------------------
// 2. ADD NEW ITALIAN NAMES
// Starting from nm_0460
// ----------------------------------------------------------------------------

console.log("\n2. Adding Italian names...");

const italianNames: {
  id: string;
  name: string;
  transliteration: string;
  species_id: string;
  etymology: string;
  phonetic: string;
  notes: string | null;
}[] = [
  {
    id: "nm_0460",
    name: "Mazzancolla",
    transliteration: "Mazzancolla",
    species_id: "sp_022", // Penaeus kerathurus (Caramote prawn)
    etymology: "From Italian mazza (mace/club) + colla (tail)\nReferring to the prawn's club-like tail",
    phonetic: "mattsan'kɔlla",
    notes: "Premium Mediterranean prawn, also called gambero imperiale",
  },
  {
    id: "nm_0461",
    name: "Calamaro",
    transliteration: "Calamaro",
    species_id: "sp_026", // Loligo vulgaris (European squid)
    etymology: "From Latin calamarius (pen case)\n↳ From calamus (reed pen), referring to the internal shell",
    phonetic: "kala'maro",
    notes: "Common squid; the word spread to Arabic as كلماري and Turkish as kalamar",
  },
  {
    id: "nm_0462",
    name: "Ombrina",
    transliteration: "Ombrina",
    species_id: "sp_029", // Umbrina cirrosa (Shi drum)
    etymology: "From Latin umbra (shadow)\nReferring to the fish's dark coloring",
    phonetic: "om'brina",
    notes: "Prized table fish, also called corvo di mare (sea raven)",
  },
  {
    id: "nm_0463",
    name: "Leccia",
    transliteration: "Leccia",
    species_id: "sp_085", // Lichia amia (Leerfish)
    etymology: "From Latin lichia, of uncertain origin\nPossibly related to λιχνεία lichneia (greediness)",
    phonetic: "'lettʃa",
    notes: "Fast-swimming predator, popular game fish",
  },
  {
    id: "nm_0464",
    name: "Scorfano nero",
    transliteration: "Scorfano nero",
    species_id: "sp_064", // Scorpaena porcus (Black scorpionfish)
    etymology: "Compound: scorfano + nero\nscorfano: from Greek σκορπαίνα skórpaina (scorpionfish), nero: black",
    phonetic: "skor'fano 'nero",
    notes: "Small scorpionfish with venomous spines; essential for Mediterranean fish soup",
  },
  {
    id: "nm_0465",
    name: "Grongo",
    transliteration: "Grongo",
    species_id: "sp_075", // Conger conger (European conger)
    etymology: "From Latin conger, from Greek γόγγρος góngros (conger eel)",
    phonetic: "'grɔŋgo",
    notes: "Large marine eel, used in fish soups",
  },
  {
    id: "nm_0466",
    name: "Capone",
    transliteration: "Capone",
    species_id: "sp_080", // Chelidonichthys lastoviza (Streaked gurnard)
    etymology: "From Italian capo (head) + -one augmentative\nLiterally 'big head', referring to the gurnard's large head",
    phonetic: "ka'pone",
    notes: "Gurnard with distinctive large head; Greek Καπόνι is borrowed from this",
  },
  {
    id: "nm_0467",
    name: "Acciuga",
    transliteration: "Acciuga",
    species_id: "sp_062", // Engraulis encrasicolus (European anchovy)
    etymology: "From Late Latin apiuva, possibly from Greek ἀφύη aphýē (anchovy)",
    phonetic: "at'tʃuga",
    notes: "European anchovy; source of Arabic أنشوفة (via Mediterranean trade)",
  },
  {
    id: "nm_0468",
    name: "Dentice corazziere",
    transliteration: "Dentice corazziere",
    species_id: "sp_096", // Dentex gibbosus (Pink dentex)
    etymology: "Compound: dentice + corazziere\ndentice: from Latin dens (tooth), corazziere: cuirassier (armored)",
    phonetic: "'dentitʃe korat'tsjɛre",
    notes: "Named for helmet-like bony hump on head; corazziere refers to armored cavalry",
  },
];

const insertItalian = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
  VALUES ($id, $name, $species_id, 'italy', 'ita', $etymology, $transliteration, $phonetic, $notes)
`);

for (const nm of italianNames) {
  insertItalian.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $etymology: nm.etymology,
    $transliteration: nm.transliteration,
    $phonetic: nm.phonetic,
    $notes: nm.notes,
  });
  console.log(`  - ${nm.id}: ${nm.name} (${nm.species_id})`);
}

// ----------------------------------------------------------------------------
// 3. ADD VENETIAN NAME
// Venetian (vec) is a separate language from standard Italian
// ----------------------------------------------------------------------------

console.log("\n3. Adding Venetian name...");

db.run(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
  VALUES (
    'nm_0469',
    'Corbèl',
    'sp_029',
    'italy',
    'vec',
    'From Latin corvus (raven), referring to the fish''s dark coloring
↳ Related to Italian corvo (raven)',
    'Corbel',
    'kor''bɛl',
    'Venetian name for shi drum; the fish makes a drumming sound'
  )
`);
console.log("  - nm_0469: Corbèl (Venetian, sp_029 - Shi drum)");

// ----------------------------------------------------------------------------
// 4. ADD BORROWED_FROM RELATIONS
// Where Italian is the source language
// ----------------------------------------------------------------------------

console.log("\n4. Adding borrowed_from relations...");

const relations: { source_id: string; target_id: string; notes: string }[] = [
  {
    source_id: "nm_0327", // Greek Καπόνι
    target_id: "nm_0466", // Italian Capone
    notes: "Greek Καπόνι borrowed from Italian capone (big head)",
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
// 5. VERIFICATION
// ----------------------------------------------------------------------------

console.log("\n5. Verification...");

// Count Italian names
const italianCount = db.query("SELECT COUNT(*) as count FROM names WHERE lang = 'ita'").get() as { count: number };
const venetianCount = db.query("SELECT COUNT(*) as count FROM names WHERE lang = 'vec'").get() as { count: number };
const totalNames = db.query("SELECT COUNT(*) as count FROM names").get() as { count: number };

console.log(`  - Italian names (ita): ${italianCount.count}`);
console.log(`  - Venetian names (vec): ${venetianCount.count}`);
console.log(`  - Total names: ${totalNames.count}`);

// Verify etymology fixes
console.log("\n  Fixed etymologies:");
const fixedNames = db.query(`
  SELECT id, name, etymology FROM names
  WHERE id IN ('nm_0133', 'nm_0260', 'nm_0322')
`).all() as { id: string; name: string; etymology: string }[];

for (const nm of fixedNames) {
  console.log(`  - ${nm.id} (${nm.name}): ${nm.etymology.split('\n')[0]}`);
}

db.close();

console.log("\n=== Migration Complete ===");
console.log("\nRun these commands to finalize:");
console.log("  pnpm db:types   # Regenerate TypeScript types");
console.log("  pnpm db:copy    # Copy database to public folder");
