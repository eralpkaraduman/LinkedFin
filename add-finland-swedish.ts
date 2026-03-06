import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Finland-Swedish names (region=finland, lang=swe)
// These are Swedish names as used in Finland (finlandssvenska)
// Most are identical to Sweden-Swedish, but some have Finnish influence

const finlandSwedishNames: {
  id: string;
  name: string;
  species_id: string;
  etymology: string;
  phonetic: string;
  notes: string | null;
}[] = [
  {
    id: "nm_0287",
    name: "Abborre",
    species_id: "sp_030", // Perca fluviatilis
    etymology: "Same as Sweden-Swedish. From Old Norse aborri.",
    phonetic: "ˈabɔrːe",
    notes: null,
  },
  {
    id: "nm_0288",
    name: "Gädda",
    species_id: "sp_031", // Esox lucius
    etymology: "Same as Sweden-Swedish. From Old Norse gedda.",
    phonetic: "ˈjɛdːa",
    notes: null,
  },
  {
    id: "nm_0289",
    name: "Gös",
    species_id: "sp_032", // Sander lucioperca
    etymology: "Same as Sweden-Swedish. Prized game fish in coastal Finland.",
    phonetic: "jøːs",
    notes: null,
  },
  {
    id: "nm_0290",
    name: "Lax",
    species_id: "sp_015", // Salmo salar
    etymology: "Same as Sweden-Swedish. From Old Norse lax.",
    phonetic: "laks",
    notes: null,
  },
  {
    id: "nm_0291",
    name: "Öring",
    species_id: "sp_033", // Salmo trutta
    etymology: "Same as Sweden-Swedish. From Old Norse aurriði.",
    phonetic: "ˈøːrɪŋ",
    notes: null,
  },
  {
    id: "nm_0292",
    name: "Sik",
    species_id: "sp_034", // Coregonus lavaretus
    etymology: "Same as Sweden-Swedish. Important food fish in Finland-Swedish cuisine.",
    phonetic: "siːk",
    notes: null,
  },
  {
    id: "nm_0293",
    name: "Mujka",
    species_id: "sp_035", // Coregonus albula (vendace)
    etymology: "Borrowed from Finnish muikku. Finland-Swedish distinctive term, differs from Sweden-Swedish siklöja.",
    phonetic: "ˈmujka",
    notes: "Finland-Swedish borrowing from Finnish, differs from rikssvenska 'siklöja'",
  },
  {
    id: "nm_0294",
    name: "Lake",
    species_id: "sp_036", // Lota lota
    etymology: "Same as Sweden-Swedish. From Old Norse laki.",
    phonetic: "ˈlɑːke",
    notes: null,
  },
  {
    id: "nm_0295",
    name: "Braxen",
    species_id: "sp_037", // Abramis brama
    etymology: "Same as Sweden-Swedish. From Old Norse braxn.",
    phonetic: "ˈbraksən",
    notes: null,
  },
  {
    id: "nm_0296",
    name: "Mört",
    species_id: "sp_038", // Rutilus rutilus
    etymology: "Same as Sweden-Swedish. Common in Finnish lakes.",
    phonetic: "møːʈ",
    notes: null,
  },
  {
    id: "nm_0297",
    name: "Nors",
    species_id: "sp_039", // Osmerus eperlanus
    etymology: "Same as Sweden-Swedish. Known for cucumber-like smell.",
    phonetic: "nɔʂ",
    notes: null,
  },
  {
    id: "nm_0298",
    name: "Strömming",
    species_id: "sp_040", // Clupea harengus membras
    etymology: "Same as Sweden-Swedish. Baltic herring, staple in archipelago cuisine.",
    phonetic: "ˈstrœmːɪŋ",
    notes: null,
  },
  {
    id: "nm_0299",
    name: "Gers",
    species_id: "sp_041", // Gymnocephalus cernua
    etymology: "Same as Sweden-Swedish gärs. Spelling variant common in Finland-Swedish.",
    phonetic: "jæːʂ",
    notes: "Also spelled gärs",
  },
  {
    id: "nm_0300",
    name: "Sarv",
    species_id: "sp_042", // Scardinius erythrophthalmus
    etymology: "Same as Sweden-Swedish. Red-finned cyprinid.",
    phonetic: "sarv",
    notes: null,
  },
  {
    id: "nm_0301",
    name: "Löja",
    species_id: "sp_043", // Alburnus alburnus
    etymology: "Same as Sweden-Swedish. Small surface-dwelling fish.",
    phonetic: "ˈløːja",
    notes: null,
  },
  {
    id: "nm_0302",
    name: "Id",
    species_id: "sp_044", // Leuciscus idus
    etymology: "Same as Sweden-Swedish. Large cyprinid.",
    phonetic: "iːd",
    notes: null,
  },
  {
    id: "nm_0303",
    name: "Björkna",
    species_id: "sp_045", // Blicca bjoerkna
    etymology: "Same as Sweden-Swedish. White bream.",
    phonetic: "ˈbjœrkna",
    notes: null,
  },
  {
    id: "nm_0304",
    name: "Ruda",
    species_id: "sp_046", // Carassius carassius
    etymology: "Same as Sweden-Swedish. Crucian carp.",
    phonetic: "ˈrʉːda",
    notes: null,
  },
  {
    id: "nm_0305",
    name: "Sutare",
    species_id: "sp_047", // Tinca tinca
    etymology: "Same as Sweden-Swedish. Literally 'cobbler'.",
    phonetic: "ˈsʉːtare",
    notes: null,
  },
  {
    id: "nm_0306",
    name: "Storspigg",
    species_id: "sp_048", // Gasterosteus aculeatus
    etymology: "Same as Sweden-Swedish. Three-spined stickleback.",
    phonetic: "ˈstuːrspɪɡ",
    notes: null,
  },
  {
    id: "nm_0307",
    name: "Regnbåge",
    species_id: "sp_049", // Oncorhynchus mykiss
    etymology: "Same as Sweden-Swedish. Rainbow trout, introduced species.",
    phonetic: "ˈrɛŋnbɔːɡe",
    notes: null,
  },
];

const insertName = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, etymology, lang, phonetic, notes)
  VALUES ($id, $name, $species_id, 'finland', $etymology, 'swe', $phonetic, $notes)
`);

for (const nm of finlandSwedishNames) {
  insertName.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $etymology: nm.etymology,
    $phonetic: nm.phonetic,
    $notes: nm.notes,
  });
}

console.log(`Added ${finlandSwedishNames.length} Finland-Swedish names`);

// ============================================
// Relations
// ============================================

const insertRelation = db.prepare(
  "INSERT OR IGNORE INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)"
);

// alternate_of relations between Finland-Swedish and Sweden-Swedish (same names)
// These show the connection between the two Swedish variants
const sameNames: [string, string, string][] = [
  ["nm_0287", "nm_0205", "Finland-Swedish Abborre same as Sweden-Swedish"],
  ["nm_0288", "nm_0206", "Finland-Swedish Gädda same as Sweden-Swedish"],
  ["nm_0289", "nm_0207", "Finland-Swedish Gös same as Sweden-Swedish"],
  ["nm_0290", "nm_0208", "Finland-Swedish Lax same as Sweden-Swedish"],
  ["nm_0291", "nm_0209", "Finland-Swedish Öring same as Sweden-Swedish"],
  ["nm_0292", "nm_0210", "Finland-Swedish Sik same as Sweden-Swedish"],
  ["nm_0294", "nm_0212", "Finland-Swedish Lake same as Sweden-Swedish"],
  ["nm_0295", "nm_0213", "Finland-Swedish Braxen same as Sweden-Swedish"],
  ["nm_0296", "nm_0214", "Finland-Swedish Mört same as Sweden-Swedish"],
  ["nm_0297", "nm_0215", "Finland-Swedish Nors same as Sweden-Swedish"],
  ["nm_0298", "nm_0216", "Finland-Swedish Strömming same as Sweden-Swedish"],
  ["nm_0299", "nm_0217", "Finland-Swedish Gers same as Sweden-Swedish Gärs (spelling variant)"],
  ["nm_0300", "nm_0218", "Finland-Swedish Sarv same as Sweden-Swedish"],
  ["nm_0301", "nm_0219", "Finland-Swedish Löja same as Sweden-Swedish"],
  ["nm_0302", "nm_0220", "Finland-Swedish Id same as Sweden-Swedish"],
  ["nm_0303", "nm_0221", "Finland-Swedish Björkna same as Sweden-Swedish"],
  ["nm_0304", "nm_0222", "Finland-Swedish Ruda same as Sweden-Swedish"],
  ["nm_0305", "nm_0223", "Finland-Swedish Sutare same as Sweden-Swedish"],
  ["nm_0306", "nm_0224", "Finland-Swedish Storspigg same as Sweden-Swedish"],
  ["nm_0307", "nm_0225", "Finland-Swedish Regnbåge same as Sweden-Swedish"],
];

// Key difference: Mujka vs Siklöja
const differentNames: [string, string, string, string][] = [
  // [Finland-Swedish, Sweden-Swedish, relation, notes]
  ["nm_0293", "nm_0211", "alternate_of", "Finland-Swedish Mujka vs Sweden-Swedish Siklöja - different terms for vendace"],
];

// Borrowing: Mujka from Finnish Muikku
const borrowings: [string, string, string][] = [
  ["nm_0293", "nm_0146", "Finland-Swedish Mujka borrowed from Finnish Muikku"],
];

console.log("\nAdding alternate_of relations (same names)...");
for (const [source, target, notes] of sameNames) {
  insertRelation.run(source, target, "alternate_of", notes);
}
console.log(`  Added ${sameNames.length} same-name relations`);

console.log("\nAdding alternate_of relations (different names)...");
for (const [source, target, relation, notes] of differentNames) {
  insertRelation.run(source, target, relation, notes);
  console.log(`  ✓ ${notes}`);
}

console.log("\nAdding borrowed_from relations...");
for (const [source, target, notes] of borrowings) {
  insertRelation.run(source, target, "borrowed_from", notes);
  console.log(`  ✓ ${notes}`);
}

// Verify
const namesCount = db.query("SELECT COUNT(*) as count FROM names").get() as { count: number };
const relationsCount = db.query("SELECT COUNT(*) as count FROM name_relations").get() as { count: number };
const finSwedishCount = db.query(
  "SELECT COUNT(*) as count FROM names WHERE region_id = 'finland' AND lang = 'swe'"
).get() as { count: number };

console.log(`\nTotal names: ${namesCount.count}`);
console.log(`Total relations: ${relationsCount.count}`);
console.log(`Finland-Swedish names: ${finSwedishCount.count}`);

db.close();
