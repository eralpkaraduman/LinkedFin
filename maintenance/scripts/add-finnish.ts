import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Add Finland region
db.run(`
  INSERT OR IGNORE INTO regions (id, name, name_local, language, notes)
  VALUES ('finland', 'Finland', 'Suomi', 'Finnish', 'Finnish freshwater and Baltic Sea fish')
`);

console.log("Added Finland region");

// New species to add (not already in DB)
// Starting from sp_030
const newSpecies: { id: string; scientific_name: string; habitat: string; notes: string }[] = [
  { id: "sp_030", scientific_name: "Perca fluviatilis", habitat: "freshwater", notes: "European perch, Finland's national fish" },
  { id: "sp_031", scientific_name: "Esox lucius", habitat: "freshwater", notes: "Northern pike, widespread predator" },
  { id: "sp_032", scientific_name: "Sander lucioperca", habitat: "freshwater", notes: "Pikeperch/zander, prized game fish" },
  { id: "sp_033", scientific_name: "Salmo trutta", habitat: "freshwater", notes: "Brown trout, includes lake and sea-run forms" },
  { id: "sp_034", scientific_name: "Coregonus lavaretus", habitat: "freshwater", notes: "European whitefish, salmonid" },
  { id: "sp_035", scientific_name: "Coregonus albula", habitat: "freshwater", notes: "Vendace, small whitefish species" },
  { id: "sp_036", scientific_name: "Lota lota", habitat: "freshwater", notes: "Burbot, only freshwater cod" },
  { id: "sp_037", scientific_name: "Abramis brama", habitat: "freshwater", notes: "Common bream, cyprinid" },
  { id: "sp_038", scientific_name: "Rutilus rutilus", habitat: "freshwater", notes: "Common roach, widespread cyprinid" },
  { id: "sp_039", scientific_name: "Osmerus eperlanus", habitat: "freshwater", notes: "European smelt, cucumber-scented" },
  { id: "sp_040", scientific_name: "Clupea harengus membras", habitat: "marine", notes: "Baltic herring, smaller subspecies of Atlantic herring" },
  { id: "sp_041", scientific_name: "Gymnocephalus cernua", habitat: "freshwater", notes: "Ruffe, small percid" },
  { id: "sp_042", scientific_name: "Scardinius erythrophthalmus", habitat: "freshwater", notes: "Rudd, red-finned cyprinid" },
  { id: "sp_043", scientific_name: "Alburnus alburnus", habitat: "freshwater", notes: "Bleak, small surface-dwelling cyprinid" },
  { id: "sp_044", scientific_name: "Leuciscus idus", habitat: "freshwater", notes: "Ide/orfe, large cyprinid" },
  { id: "sp_045", scientific_name: "Blicca bjoerkna", habitat: "freshwater", notes: "White bream/silver bream" },
  { id: "sp_046", scientific_name: "Carassius carassius", habitat: "freshwater", notes: "Crucian carp, tolerates low oxygen" },
  { id: "sp_047", scientific_name: "Tinca tinca", habitat: "freshwater", notes: "Tench, slimy bottom-dweller" },
  { id: "sp_048", scientific_name: "Gasterosteus aculeatus", habitat: "freshwater", notes: "Three-spined stickleback" },
];

const insertSpecies = db.prepare(`
  INSERT OR IGNORE INTO species (id, scientific_name, habitat, notes)
  VALUES ($id, $scientific_name, $habitat, $notes)
`);

for (const sp of newSpecies) {
  insertSpecies.run({
    $id: sp.id,
    $scientific_name: sp.scientific_name,
    $habitat: sp.habitat,
    $notes: sp.notes,
  });
}

console.log(`Added ${newSpecies.length} new species`);

// Finnish names to add
// Starting from nm_0140
const finnishNames: {
  id: string;
  name: string;
  species_id: string;
  etymology: string;
  lang: string;
}[] = [
  // Existing species (Salmo salar)
  {
    id: "nm_0140",
    name: "Lohi",
    species_id: "sp_015", // Salmo salar already exists
    etymology: "From Proto-Finnic *lohi, possibly related to Proto-Indo-European *laks- (salmon). Cognate with Estonian lõhi.",
    lang: "fin",
  },
  // New species
  {
    id: "nm_0141",
    name: "Ahven",
    species_id: "sp_030",
    etymology: "From Proto-Finnic *ahven, from Proto-Uralic. Cognate with Estonian ahven, Hungarian has related forms. Finland's national fish.",
    lang: "fin",
  },
  {
    id: "nm_0142",
    name: "Hauki",
    species_id: "sp_031",
    etymology: "From Proto-Finnic *haugi, from Proto-Uralic *šawka. Cognate with Estonian haug, Hungarian csuka.",
    lang: "fin",
  },
  {
    id: "nm_0143",
    name: "Kuha",
    species_id: "sp_032",
    etymology: "From Proto-Finnic *kuha. Cognate with Estonian koha. Prized for its white, flaky flesh.",
    lang: "fin",
  },
  {
    id: "nm_0144",
    name: "Taimen",
    species_id: "sp_033",
    etymology: "From Proto-Finnic *taimen, related to Proto-Uralic fish terminology. Cognate with Estonian taimen.",
    lang: "fin",
  },
  {
    id: "nm_0145",
    name: "Siika",
    species_id: "sp_034",
    etymology: "From Proto-Finnic *siika. Cognate with Estonian siig. Important food fish in Finnish cuisine.",
    lang: "fin",
  },
  {
    id: "nm_0146",
    name: "Muikku",
    species_id: "sp_035",
    etymology: "Possibly onomatopoeic or descriptive of the small, silvery fish. A Finnish delicacy, especially fried.",
    lang: "fin",
  },
  {
    id: "nm_0147",
    name: "Made",
    species_id: "sp_036",
    etymology: "From Proto-Finnic *mateh. Cognate with Estonian made. The only freshwater member of the cod family.",
    lang: "fin",
  },
  {
    id: "nm_0148",
    name: "Lahna",
    species_id: "sp_037",
    etymology: "From Proto-Finnic *lahna. Cognate with Estonian latikas. Common in nutrient-rich Finnish lakes.",
    lang: "fin",
  },
  {
    id: "nm_0149",
    name: "Särki",
    species_id: "sp_038",
    etymology: "From Proto-Finnic *särki. Cognate with Estonian särgik. Most common cyprinid in Finland.",
    lang: "fin",
  },
  {
    id: "nm_0150",
    name: "Kuore",
    species_id: "sp_039",
    etymology: "From Proto-Finnic *kuoreh. Also called norssi. Known for its cucumber-like smell.",
    lang: "fin",
  },
  {
    id: "nm_0151",
    name: "Silakka",
    species_id: "sp_040",
    etymology: "From Swedish sill (herring) with Finnish diminutive suffix -kka. Baltic Sea subspecies of Atlantic herring.",
    lang: "fin",
  },
  {
    id: "nm_0152",
    name: "Kiiski",
    species_id: "sp_041",
    etymology: "Possibly from Proto-Finnic, describing the spiny nature of the fish. Cognate with Estonian kiisk.",
    lang: "fin",
  },
  {
    id: "nm_0153",
    name: "Sorva",
    species_id: "sp_042",
    etymology: "From Proto-Finnic *sorva. Known for its red fins, considered one of Finland's most beautiful fish.",
    lang: "fin",
  },
  {
    id: "nm_0154",
    name: "Salakka",
    species_id: "sp_043",
    etymology: "Possibly related to Finnish sala (secret, hidden) describing its surface-swimming behavior.",
    lang: "fin",
  },
  {
    id: "nm_0155",
    name: "Säyne",
    species_id: "sp_044",
    etymology: "From Proto-Finnic. Large cyprinid often mistaken for large roach. Cognate with Estonian säinas.",
    lang: "fin",
  },
  {
    id: "nm_0156",
    name: "Pasuri",
    species_id: "sp_045",
    etymology: "Finnish name for white bream. Resembles lahna (bream) but smaller with proportionally larger eyes.",
    lang: "fin",
  },
  {
    id: "nm_0157",
    name: "Ruutana",
    species_id: "sp_046",
    etymology: "From Proto-Finnic. Can survive in oxygen-poor conditions by producing alcohol in its tissues.",
    lang: "fin",
  },
  {
    id: "nm_0158",
    name: "Suutari",
    species_id: "sp_047",
    etymology: "Literally 'cobbler/shoemaker' in Finnish, possibly referring to its dark, leathery appearance.",
    lang: "fin",
  },
  {
    id: "nm_0159",
    name: "Kolmipiikki",
    species_id: "sp_048",
    etymology: "Compound: kolmi (three) + piikki (spike/spine). Descriptive of its three dorsal spines.",
    lang: "fin",
  },
];

const insertName = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, etymology, lang)
  VALUES ($id, $name, $species_id, 'finland', $etymology, $lang)
`);

for (const nm of finnishNames) {
  insertName.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $etymology: nm.etymology,
    $lang: nm.lang,
  });
}

console.log(`Added ${finnishNames.length} Finnish names`);

// Verify
const speciesCount = db.query("SELECT COUNT(*) as count FROM species").get() as { count: number };
const namesCount = db.query("SELECT COUNT(*) as count FROM names").get() as { count: number };
const finnishCount = db.query("SELECT COUNT(*) as count FROM names WHERE region_id = 'finland'").get() as { count: number };

console.log(`\nTotal species: ${speciesCount.count}`);
console.log(`Total names: ${namesCount.count}`);
console.log(`Finnish names: ${finnishCount.count}`);

db.close();
