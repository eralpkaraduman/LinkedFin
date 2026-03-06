import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// English common names for the Finnish species (international names)
// Starting from nm_0160
const englishNames: {
  id: string;
  name: string;
  species_id: string;
  etymology: string;
}[] = [
  {
    id: "nm_0160",
    name: "European perch",
    species_id: "sp_030",
    etymology: "From Old French perche, from Latin perca, from Greek πέρκη (perke), meaning spotted or dark-colored.",
  },
  {
    id: "nm_0161",
    name: "Northern pike",
    species_id: "sp_031",
    etymology: "From Middle English pike, referring to its pointed snout resembling a pike (weapon).",
  },
  {
    id: "nm_0162",
    name: "Pikeperch",
    species_id: "sp_032",
    etymology: "Compound name: combines pike (for its body shape) and perch (its family). Also called zander.",
  },
  {
    id: "nm_0163",
    name: "Zander",
    species_id: "sp_032",
    etymology: "From German Zander, from Middle Low German sandat, possibly related to sand (its habitat preference).",
  },
  {
    id: "nm_0164",
    name: "Brown trout",
    species_id: "sp_033",
    etymology: "From Old English truht, from Latin tructa, from Greek τρώκτης (troktes) meaning gnawer. Brown refers to coloration.",
  },
  {
    id: "nm_0165",
    name: "European whitefish",
    species_id: "sp_034",
    etymology: "Named for its white flesh. A salmonid found across northern Europe and Asia.",
  },
  {
    id: "nm_0166",
    name: "Vendace",
    species_id: "sp_035",
    etymology: "From Old French vendese, vendoise (dace). A small whitefish species prized in Nordic cuisine.",
  },
  {
    id: "nm_0167",
    name: "Burbot",
    species_id: "sp_036",
    etymology: "From Old French bourbotte, related to bourbe (mud), describing its bottom-dwelling habits. The only freshwater cod.",
  },
  {
    id: "nm_0168",
    name: "Common bream",
    species_id: "sp_037",
    etymology: "From Old French bresme, of Germanic origin. Also called bronze bream for its coloration.",
  },
  {
    id: "nm_0169",
    name: "Common roach",
    species_id: "sp_038",
    etymology: "From Old French roche, possibly related to Latin rubeus (red), referring to its red fins.",
  },
  {
    id: "nm_0170",
    name: "European smelt",
    species_id: "sp_039",
    etymology: "From Old English smelt. Known for its distinctive cucumber-like odor when fresh.",
  },
  {
    id: "nm_0171",
    name: "Baltic herring",
    species_id: "sp_040",
    etymology: "A smaller subspecies of Atlantic herring endemic to the brackish Baltic Sea.",
  },
  {
    id: "nm_0172",
    name: "Ruffe",
    species_id: "sp_041",
    etymology: "From Middle English ruff, possibly from rough, referring to its spiny dorsal fin.",
  },
  {
    id: "nm_0173",
    name: "Rudd",
    species_id: "sp_042",
    etymology: "From Old English rudu (redness), referring to its distinctive red fins.",
  },
  {
    id: "nm_0174",
    name: "Bleak",
    species_id: "sp_043",
    etymology: "From Old Norse bleikja (to bleach), referring to its pale, silvery coloration.",
  },
  {
    id: "nm_0175",
    name: "Ide",
    species_id: "sp_044",
    etymology: "From Swedish id. Also called orfe (golden variety). A large cyprinid.",
  },
  {
    id: "nm_0176",
    name: "White bream",
    species_id: "sp_045",
    etymology: "Named for its silvery-white coloration, distinguishing it from the bronze/common bream.",
  },
  {
    id: "nm_0177",
    name: "Crucian carp",
    species_id: "sp_046",
    etymology: "From German Karausche, from Low German karusse. Can survive frozen into ice and low-oxygen conditions.",
  },
  {
    id: "nm_0178",
    name: "Tench",
    species_id: "sp_047",
    etymology: "From Old French tenche, from Late Latin tinca. Known for its slimy, mucus-covered skin.",
  },
  {
    id: "nm_0179",
    name: "Three-spined stickleback",
    species_id: "sp_048",
    etymology: "Named for its three prominent dorsal spines. Famous for complex mating behavior studied by Tinbergen.",
  },
];

const insertName = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, etymology, lang)
  VALUES ($id, $name, $species_id, 'international', $etymology, 'eng')
`);

for (const nm of englishNames) {
  insertName.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $etymology: nm.etymology,
  });
}

console.log(`Added ${englishNames.length} English/international names`);

// Verify
const namesCount = db.query("SELECT COUNT(*) as count FROM names").get() as { count: number };
const intlCount = db.query("SELECT COUNT(*) as count FROM names WHERE region_id = 'international'").get() as { count: number };

console.log(`\nTotal names: ${namesCount.count}`);
console.log(`International names: ${intlCount.count}`);

db.close();
