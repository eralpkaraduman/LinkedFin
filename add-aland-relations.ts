import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// ============================================
// 1. Add sea trout variants (Meritaimen, Havsöring)
// ============================================

const seaTroutNames: {
  id: string;
  name: string;
  species_id: string;
  region_id: string;
  lang: string;
  etymology: string;
  phonetic: string;
  transliteration: string;
  notes: string;
}[] = [
  {
    id: "nm_0308",
    name: "Meritaimen",
    species_id: "sp_033", // Salmo trutta
    region_id: "finland",
    lang: "fin",
    etymology: "Compound: meri (sea) + taimen (trout). Sea-run form of brown trout.",
    phonetic: "ˈmeritɑimen",
    transliteration: "Meritaimen", // Latin script, same as name
    notes: "Sea trout, anadromous form of Salmo trutta",
  },
  {
    id: "nm_0309",
    name: "Havsöring",
    species_id: "sp_033", // Salmo trutta
    region_id: "sweden",
    lang: "swe",
    etymology: "Compound: hav (sea) + öring (trout). Sea-run form of brown trout.",
    phonetic: "ˈhɑːvsøːrɪŋ",
    transliteration: "Havsöring", // Latin script, same as name
    notes: "Sea trout, anadromous form of Salmo trutta",
  },
  {
    id: "nm_0310",
    name: "Havsöring",
    species_id: "sp_033", // Salmo trutta
    region_id: "finland",
    lang: "swe",
    etymology: "Compound: hav (sea) + öring (trout). Used in Finland-Swedish for sea trout.",
    phonetic: "ˈhɑːvsøːrɪŋ",
    transliteration: "Havsöring", // Latin script, same as name
    notes: "Finland-Swedish sea trout name",
  },
  {
    id: "nm_0311",
    name: "Sea trout",
    species_id: "sp_033", // Salmo trutta
    region_id: "international",
    lang: "eng",
    etymology: "Sea-running form of brown trout (Salmo trutta). Anadromous lifecycle.",
    phonetic: "siː traʊt",
    transliteration: "Sea trout",
    notes: "Anadromous form of brown trout",
  },
];

const insertName = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, lang, etymology, phonetic, transliteration, notes)
  VALUES ($id, $name, $species_id, $region_id, $lang, $etymology, $phonetic, $transliteration, $notes)
`);

for (const nm of seaTroutNames) {
  insertName.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $region_id: nm.region_id,
    $lang: nm.lang,
    $etymology: nm.etymology,
    $phonetic: nm.phonetic,
    $transliteration: nm.transliteration,
    $notes: nm.notes,
  });
}

console.log(`Added ${seaTroutNames.length} sea trout variant names`);

// ============================================
// 2. Relations for sea trout variants
// ============================================

const insertRelation = db.prepare(
  "INSERT OR IGNORE INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)"
);

// Sea trout alternates of base trout names
const seaTroutAlternates: [string, string, string][] = [
  ["nm_0308", "nm_0144", "Meritaimen is sea-run form of Taimen"],
  ["nm_0309", "nm_0209", "Sweden-Swedish Havsöring is sea-run form of Öring"],
  ["nm_0310", "nm_0291", "Finland-Swedish Havsöring is sea-run form of Öring"],
  ["nm_0309", "nm_0310", "Sweden-Swedish and Finland-Swedish Havsöring are same"],
  ["nm_0308", "nm_0310", "Finnish Meritaimen equivalent to Finland-Swedish Havsöring"],
];

console.log("\nAdding sea trout alternate relations...");
for (const [source, target, notes] of seaTroutAlternates) {
  insertRelation.run(source, target, "alternate_of", notes);
  console.log(`  ✓ ${notes}`);
}

// ============================================
// 3. Cross-language relations: Finnish ↔ Finland-Swedish
// These show bilingual equivalents used in Finland
// ============================================

const crossLangRelations: [string, string, string][] = [
  // Finnish ID, Finland-Swedish ID, notes
  ["nm_0141", "nm_0287", "Finnish Ahven ↔ Finland-Swedish Abborre (perch)"],
  ["nm_0142", "nm_0288", "Finnish Hauki ↔ Finland-Swedish Gädda (pike)"],
  ["nm_0143", "nm_0289", "Finnish Kuha ↔ Finland-Swedish Gös (pikeperch)"],
  ["nm_0140", "nm_0290", "Finnish Lohi ↔ Finland-Swedish Lax (salmon)"],
  ["nm_0144", "nm_0291", "Finnish Taimen ↔ Finland-Swedish Öring (trout)"],
  ["nm_0145", "nm_0292", "Finnish Siika ↔ Finland-Swedish Sik (whitefish)"],
  ["nm_0146", "nm_0293", "Finnish Muikku ↔ Finland-Swedish Mujka (vendace)"],
  ["nm_0147", "nm_0294", "Finnish Made ↔ Finland-Swedish Lake (burbot)"],
  ["nm_0148", "nm_0295", "Finnish Lahna ↔ Finland-Swedish Braxen (bream)"],
  ["nm_0149", "nm_0296", "Finnish Särki ↔ Finland-Swedish Mört (roach)"],
  ["nm_0150", "nm_0297", "Finnish Kuore ↔ Finland-Swedish Nors (smelt)"],
  ["nm_0151", "nm_0298", "Finnish Silakka ↔ Finland-Swedish Strömming (Baltic herring)"],
  ["nm_0152", "nm_0299", "Finnish Kiiski ↔ Finland-Swedish Gers (ruffe)"],
  ["nm_0153", "nm_0300", "Finnish Sorva ↔ Finland-Swedish Sarv (rudd)"],
  ["nm_0154", "nm_0301", "Finnish Salakka ↔ Finland-Swedish Löja (bleak)"],
  ["nm_0155", "nm_0302", "Finnish Säyne ↔ Finland-Swedish Id (ide)"],
  ["nm_0156", "nm_0303", "Finnish Pasuri ↔ Finland-Swedish Björkna (white bream)"],
  ["nm_0157", "nm_0304", "Finnish Ruutana ↔ Finland-Swedish Ruda (crucian carp)"],
  ["nm_0158", "nm_0305", "Finnish Suutari ↔ Finland-Swedish Sutare (tench)"],
  ["nm_0159", "nm_0306", "Finnish Kolmipiikki ↔ Finland-Swedish Storspigg (stickleback)"],
  ["nm_0180", "nm_0307", "Finnish Kirjolohi ↔ Finland-Swedish Regnbåge (rainbow trout)"],
];

console.log("\nAdding Finnish ↔ Finland-Swedish cross-language relations...");
for (const [finnish, finSwedish, notes] of crossLangRelations) {
  insertRelation.run(finnish, finSwedish, "alternate_of", notes);
}
console.log(`  Added ${crossLangRelations.length} cross-language relations`);

// ============================================
// 4. Interesting borrowing patterns to highlight
// ============================================

// Finnish Suutari and Swedish Sutare share same etymology (cobbler)
// This is likely a calque (loan translation) - let's document it
console.log("\nNote: Finnish 'Suutari' and Swedish 'Sutare' both mean 'cobbler'");
console.log("This is a semantic calque - same metaphor in both languages");

// Verify
const namesCount = db.query("SELECT COUNT(*) as count FROM names").get() as { count: number };
const relationsCount = db.query("SELECT COUNT(*) as count FROM name_relations").get() as { count: number };

console.log(`\nTotal names: ${namesCount.count}`);
console.log(`Total relations: ${relationsCount.count}`);

// Show cross-language pairs
console.log("\nSample Finnish ↔ Finland-Swedish pairs:");
const pairs = db.query(`
  SELECT n1.name as finnish, n2.name as fin_swedish, s.scientific_name
  FROM name_relations r
  JOIN names n1 ON r.source_id = n1.id
  JOIN names n2 ON r.target_id = n2.id
  JOIN species s ON n1.species_id = s.id
  WHERE n1.lang = 'fin' AND n2.lang = 'swe'
    AND n1.region_id = 'finland' AND n2.region_id = 'finland'
  LIMIT 10
`).all() as { finnish: string; fin_swedish: string; scientific_name: string }[];

for (const p of pairs) {
  console.log(`  ${p.finnish} ↔ ${p.fin_swedish} (${p.scientific_name})`);
}

db.close();
