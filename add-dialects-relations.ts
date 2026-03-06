import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Add new regions
db.run(`
  INSERT OR IGNORE INTO regions (id, name, name_local, language, notes)
  VALUES ('estonia', 'Estonia', 'Eesti', 'Estonian', 'Estonian freshwater and Baltic fish names - Finnic language closely related to Finnish')
`);

db.run(`
  INSERT OR IGNORE INTO regions (id, name, name_local, language, notes)
  VALUES ('sapmi', 'Sápmi', 'Sápmi', 'Northern Sami', 'Northern Sami fish names from Lapland region (Finland, Sweden, Norway)')
`);

console.log("Added Estonia and Sápmi regions");

// ============================================
// 1. Finnish dialectal variants
// ============================================
const finnishDialects: {
  id: string;
  name: string;
  species_id: string;
  etymology: string;
  phonetic: string;
  notes: string;
}[] = [
  // Kuore variants
  {
    id: "nm_0264",
    name: "Norssi",
    species_id: "sp_039", // Osmerus eperlanus
    etymology: "Alternative Finnish name for smelt, possibly from Swedish nors. Used in various regions.",
    phonetic: "ˈnorsːi",
    notes: "Dialectal variant of kuore",
  },
  {
    id: "nm_0265",
    name: "Kurvi",
    species_id: "sp_039", // Osmerus eperlanus
    etymology: "Regional Finnish name for smelt. Origin uncertain.",
    phonetic: "ˈkurʋi",
    notes: "Regional dialectal variant of kuore",
  },
  {
    id: "nm_0266",
    name: "Siniäinen",
    species_id: "sp_039", // Osmerus eperlanus
    etymology: "From sininen (blue), possibly referring to the bluish tint of fresh smelt.",
    phonetic: "ˈsiniæinen",
    notes: "Regional dialectal variant of kuore",
  },
  // Silli - separate word for herring (not Baltic herring specifically)
  {
    id: "nm_0267",
    name: "Silli",
    species_id: "sp_040", // Clupea harengus membras (using Baltic herring, though silli can mean Atlantic herring too)
    etymology: "Borrowed from Swedish sill (herring). Used for herring in general, especially salted/pickled.",
    phonetic: "ˈsilːi",
    notes: "Borrowed from Swedish, often used for prepared/salted herring",
  },
];

// ============================================
// 2. Estonian names (Finnic cognates)
// ============================================
const estonianNames: {
  id: string;
  name: string;
  species_id: string;
  etymology: string;
  phonetic: string;
}[] = [
  {
    id: "nm_0268",
    name: "Ahven",
    species_id: "sp_030", // Perca fluviatilis
    etymology: "From Proto-Finnic *ahven. Cognate with Finnish ahven - identical form showing close Finnic relationship.",
    phonetic: "ˈɑhʋen",
  },
  {
    id: "nm_0269",
    name: "Haug",
    species_id: "sp_031", // Esox lucius
    etymology: "From Proto-Finnic *haugi. Cognate with Finnish hauki - shows Finnic sound correspondence.",
    phonetic: "hɑuɡ",
  },
  {
    id: "nm_0270",
    name: "Koha",
    species_id: "sp_032", // Sander lucioperca
    etymology: "From Proto-Finnic *kuha. Cognate with Finnish kuha - shows regular Finnic vowel correspondence.",
    phonetic: "ˈkohɑ",
  },
  {
    id: "nm_0271",
    name: "Lõhi",
    species_id: "sp_015", // Salmo salar
    etymology: "From Proto-Finnic *lohi. Cognate with Finnish lohi - Estonian õ corresponds to Finnish o.",
    phonetic: "lɤhi",
  },
  {
    id: "nm_0272",
    name: "Siig",
    species_id: "sp_034", // Coregonus lavaretus
    etymology: "From Proto-Finnic *siika. Cognate with Finnish siika - shows regular Finnic correspondence.",
    phonetic: "siːɡ",
  },
  {
    id: "nm_0273",
    name: "Made",
    species_id: "sp_036", // Lota lota
    etymology: "From Proto-Finnic *mateh. Identical to Finnish made - shared Finnic inheritance.",
    phonetic: "ˈmɑde",
  },
  {
    id: "nm_0274",
    name: "Latikas",
    species_id: "sp_037", // Abramis brama
    etymology: "Estonian name for bream. Compare Finnish lahna - different Finnic development.",
    phonetic: "ˈlɑtikɑs",
  },
  {
    id: "nm_0275",
    name: "Särg",
    species_id: "sp_038", // Rutilus rutilus
    etymology: "From Proto-Finnic *särki. Cognate with Finnish särki - shows regular correspondence.",
    phonetic: "særɡ",
  },
  {
    id: "nm_0276",
    name: "Räim",
    species_id: "sp_040", // Clupea harengus membras
    etymology: "Estonian name for Baltic herring. Compare Finnish silakka (Swedish loan) - räim is native Finnic.",
    phonetic: "højm",
  },
  {
    id: "nm_0277",
    name: "Forell",
    species_id: "sp_033", // Salmo trutta
    etymology: "From German Forelle (trout). Also used: Meriforell (sea trout).",
    phonetic: "foˈrelː",
  },
  {
    id: "nm_0278",
    name: "Kiisk",
    species_id: "sp_041", // Gymnocephalus cernua
    etymology: "From Proto-Finnic. Cognate with Finnish kiiski - nearly identical form.",
    phonetic: "kiːsk",
  },
  {
    id: "nm_0279",
    name: "Linask",
    species_id: "sp_047", // Tinca tinca
    etymology: "Estonian name for tench. Compare Finnish suutari (cobbler) - different naming metaphor.",
    phonetic: "ˈlinɑsk",
  },
  {
    id: "nm_0280",
    name: "Koger",
    species_id: "sp_046", // Carassius carassius
    etymology: "Estonian name for crucian carp. Compare Finnish ruutana.",
    phonetic: "ˈkoɡer",
  },
  {
    id: "nm_0281",
    name: "Vikerforell",
    species_id: "sp_049", // Oncorhynchus mykiss
    etymology: "Compound: viker (rainbow) + forell (trout). Calque from English rainbow trout.",
    phonetic: "ˈʋikerforelː",
  },
];

// ============================================
// 3. Northern Sami names
// ============================================
const samiNames: {
  id: string;
  name: string;
  species_id: string;
  etymology: string;
  phonetic: string;
}[] = [
  {
    id: "nm_0282",
    name: "Luossa",
    species_id: "sp_015", // Salmo salar
    etymology: "Northern Sami word for salmon. Central to Sami culture and fishing traditions along rivers like Tana/Deatnu.",
    phonetic: "ˈluosːɑ",
  },
  {
    id: "nm_0283",
    name: "Guolli",
    species_id: "sp_030", // Using perch as representative - guolli means 'fish' generally but also used for specific fish
    etymology: "Northern Sami general word for fish. Also used in compounds for specific fish types.",
    phonetic: "ˈɡuolːi",
  },
  {
    id: "nm_0284",
    name: "Hávga",
    species_id: "sp_031", // Esox lucius
    etymology: "Northern Sami word for pike. Compare Finnish hauki, Swedish gädda.",
    phonetic: "ˈhɑːvɡɑ",
  },
  {
    id: "nm_0285",
    name: "Čuovža",
    species_id: "sp_034", // Coregonus lavaretus
    etymology: "Northern Sami word for whitefish. Important food fish in Sami tradition.",
    phonetic: "ˈtʃuovʒɑ",
  },
  {
    id: "nm_0286",
    name: "Dápmoš",
    species_id: "sp_033", // Salmo trutta
    etymology: "Northern Sami word for trout.",
    phonetic: "ˈdɑːpmoʃ",
  },
];

// Insert Finnish dialects
const insertFinnishDialect = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, etymology, lang, phonetic, notes)
  VALUES ($id, $name, $species_id, 'finland', $etymology, 'fin', $phonetic, $notes)
`);

for (const nm of finnishDialects) {
  insertFinnishDialect.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $etymology: nm.etymology,
    $phonetic: nm.phonetic,
    $notes: nm.notes,
  });
}
console.log(`Added ${finnishDialects.length} Finnish dialectal variants`);

// Insert Estonian names
const insertEstonian = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, etymology, lang, phonetic)
  VALUES ($id, $name, $species_id, 'estonia', $etymology, 'est', $phonetic)
`);

for (const nm of estonianNames) {
  insertEstonian.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $etymology: nm.etymology,
    $phonetic: nm.phonetic,
  });
}
console.log(`Added ${estonianNames.length} Estonian names`);

// Insert Sami names
const insertSami = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, etymology, lang, phonetic)
  VALUES ($id, $name, $species_id, 'sapmi', $etymology, 'sme', $phonetic)
`);

for (const nm of samiNames) {
  insertSami.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $etymology: nm.etymology,
    $phonetic: nm.phonetic,
  });
}
console.log(`Added ${samiNames.length} Northern Sami names`);

// ============================================
// 4. Relations
// ============================================

// alternate_of relations for Finnish dialects
const alternates: [string, string, string][] = [
  // Kuore variants are alternates of each other
  ["nm_0264", "nm_0150", "Norssi is alternate name for Kuore (smelt)"],
  ["nm_0265", "nm_0150", "Kurvi is regional alternate for Kuore (smelt)"],
  ["nm_0266", "nm_0150", "Siniäinen is regional alternate for Kuore (smelt)"],
  // Silli alternate of Silakka (both refer to herring)
  ["nm_0267", "nm_0151", "Silli and Silakka both refer to herring in Finnish"],
];

// borrowed_from relations
const borrowings: [string, string, string][] = [
  // Finnish silakka from Swedish
  ["nm_0151", "nm_0216", "Finnish silakka borrowed from Swedish sillake (sill + lake = herring brine)"],
  // Finnish silli from Swedish
  ["nm_0267", "nm_0216", "Finnish silli borrowed from Swedish sill (herring)"],
  // Finnish norssi possibly from Swedish nors
  ["nm_0264", "nm_0215", "Finnish norssi possibly borrowed from Swedish nors"],
];

const insertRelation = db.prepare(
  "INSERT OR IGNORE INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)"
);

console.log("\nAdding alternate_of relations...");
for (const [source, target, notes] of alternates) {
  insertRelation.run(source, target, "alternate_of", notes);
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

console.log(`\nTotal names: ${namesCount.count}`);
console.log(`Total relations: ${relationsCount.count}`);

// Summary by region
console.log("\nNames by region:");
const byRegion = db.query(`
  SELECT region_id, COUNT(*) as count
  FROM names
  GROUP BY region_id
  ORDER BY count DESC
`).all() as { region_id: string; count: number }[];

for (const r of byRegion) {
  console.log(`  ${r.region_id}: ${r.count}`);
}

db.close();
