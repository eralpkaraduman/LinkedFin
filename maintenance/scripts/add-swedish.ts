import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Add Sweden region
db.run(`
  INSERT OR IGNORE INTO regions (id, name, name_local, language, notes)
  VALUES ('sweden', 'Sweden', 'Sverige', 'Swedish', 'Swedish freshwater and Baltic Sea fish names')
`);

console.log("Added Sweden region");

// Swedish names to add
// Starting from nm_0205
const swedishNames: {
  id: string;
  name: string;
  species_id: string;
  etymology: string;
  phonetic: string;
}[] = [
  {
    id: "nm_0205",
    name: "Abborre",
    species_id: "sp_030", // Perca fluviatilis
    etymology: "From Old Norse aborri, from Proto-Germanic *aburô. Cognate with German Barsch.",
    phonetic: "ˈabɔrːɛ",
  },
  {
    id: "nm_0206",
    name: "Gädda",
    species_id: "sp_031", // Esox lucius
    etymology: "From Old Norse gedda, possibly related to gaddr (spike, sting), referring to its pointed snout.",
    phonetic: "ˈjɛdːa",
  },
  {
    id: "nm_0207",
    name: "Gös",
    species_id: "sp_032", // Sander lucioperca
    etymology: "From Old Norse gǫ́s, related to German dialectal Gös. Prized game fish in Sweden.",
    phonetic: "jøːs",
  },
  {
    id: "nm_0208",
    name: "Lax",
    species_id: "sp_015", // Salmo salar
    etymology: "From Old Norse lax, from Proto-Germanic *lahsaz, from PIE *laks- (salmon). Cognate with German Lachs.",
    phonetic: "laks",
  },
  {
    id: "nm_0209",
    name: "Öring",
    species_id: "sp_033", // Salmo trutta
    etymology: "From Old Norse aurriði, auringr, possibly related to aurr (gravel, sand) where trout spawn.",
    phonetic: "ˈøːrɪŋ",
  },
  {
    id: "nm_0210",
    name: "Sik",
    species_id: "sp_034", // Coregonus lavaretus
    etymology: "From Old Norse síkr, from Proto-Germanic *sīkaz. Cognate with Finnish siika (borrowed).",
    phonetic: "siːk",
  },
  {
    id: "nm_0211",
    name: "Siklöja",
    species_id: "sp_035", // Coregonus albula
    etymology: "Compound: sik (whitefish) + löja (bleak), describing this small whitefish species.",
    phonetic: "ˈsiːkløja",
  },
  {
    id: "nm_0212",
    name: "Lake",
    species_id: "sp_036", // Lota lota
    etymology: "From Old Norse laki, possibly related to laka (to drip), referring to its slimy skin.",
    phonetic: "ˈlɑːkɛ",
  },
  {
    id: "nm_0213",
    name: "Braxen",
    species_id: "sp_037", // Abramis brama
    etymology: "From Old Norse braxn, from Proto-Germanic *brahsmō. Cognate with German Brassen, Brachse.",
    phonetic: "ˈbraksɛn",
  },
  {
    id: "nm_0214",
    name: "Mört",
    species_id: "sp_038", // Rutilus rutilus
    etymology: "From Old Norse mort, murt. Related to words for crumbling/soft, possibly describing the flesh.",
    phonetic: "møːʈ",
  },
  {
    id: "nm_0215",
    name: "Nors",
    species_id: "sp_039", // Osmerus eperlanus
    etymology: "From Old Norse nǫrs. Known for its cucumber-like smell. Also called slom in some dialects.",
    phonetic: "nɔʂ",
  },
  {
    id: "nm_0216",
    name: "Strömming",
    species_id: "sp_040", // Clupea harengus membras
    etymology: "From ström (stream, current), referring to its schooling behavior in currents. Baltic herring.",
    phonetic: "ˈstrœmːɪŋ",
  },
  {
    id: "nm_0217",
    name: "Gärs",
    species_id: "sp_041", // Gymnocephalus cernua
    etymology: "From Old Norse gersi, related to words for rough/spiny, describing its spiny fins.",
    phonetic: "jæːʂ",
  },
  {
    id: "nm_0218",
    name: "Sarv",
    species_id: "sp_042", // Scardinius erythrophthalmus
    etymology: "From Old Norse sǫrfr. Known for its red fins and golden scales.",
    phonetic: "sarv",
  },
  {
    id: "nm_0219",
    name: "Löja",
    species_id: "sp_043", // Alburnus alburnus
    etymology: "From Old Norse *lauja, related to ljós (light), describing its silvery, shiny scales.",
    phonetic: "ˈløːja",
  },
  {
    id: "nm_0220",
    name: "Id",
    species_id: "sp_044", // Leuciscus idus
    etymology: "From Old Norse ið. A large cyprinid. The golden variety is called guldid (golden ide).",
    phonetic: "iːd",
  },
  {
    id: "nm_0221",
    name: "Björkna",
    species_id: "sp_045", // Blicca bjoerkna
    etymology: "Possibly from björk (birch), referring to its silvery color like birch bark.",
    phonetic: "ˈbjœrkna",
  },
  {
    id: "nm_0222",
    name: "Ruda",
    species_id: "sp_046", // Carassius carassius
    etymology: "From Old Norse ruða, related to ruðr (red), possibly referring to its coloration.",
    phonetic: "ˈrʉːda",
  },
  {
    id: "nm_0223",
    name: "Sutare",
    species_id: "sp_047", // Tinca tinca
    etymology: "From Old Norse sútari, literally 'cobbler/shoemaker', same metaphor as Finnish suutari.",
    phonetic: "ˈsʉːtarɛ",
  },
  {
    id: "nm_0224",
    name: "Storspigg",
    species_id: "sp_048", // Gasterosteus aculeatus
    etymology: "Compound: stor (large) + spigg (stickleback), distinguishing from småspigg (nine-spined).",
    phonetic: "ˈstuːrspɪɡ",
  },
  {
    id: "nm_0225",
    name: "Regnbåge",
    species_id: "sp_049", // Oncorhynchus mykiss
    etymology: "Literally 'rainbow', calque from English rainbow trout, referring to its colorful lateral stripe.",
    phonetic: "ˈrɛŋnbɔːɡɛ",
  },
];

const insertName = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, etymology, lang, phonetic)
  VALUES ($id, $name, $species_id, 'sweden', $etymology, 'swe', $phonetic)
`);

for (const nm of swedishNames) {
  insertName.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $etymology: nm.etymology,
    $phonetic: nm.phonetic,
  });
}

console.log(`Added ${swedishNames.length} Swedish names`);

// Verify
const namesCount = db.query("SELECT COUNT(*) as count FROM names").get() as { count: number };
const sweCount = db.query("SELECT COUNT(*) as count FROM names WHERE region_id = 'sweden'").get() as { count: number };

console.log(`\nTotal names: ${namesCount.count}`);
console.log(`Swedish names: ${sweCount.count}`);

db.close();
