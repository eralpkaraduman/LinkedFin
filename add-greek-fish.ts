import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// New species to add (starting from sp_065)
const newSpecies: { id: string; scientific_name: string; family: string; habitat: string; notes: string }[] = [
  { id: "sp_065", scientific_name: "Boops boops", family: "Sparidae", habitat: "marine", notes: "Bogue, small seabream common in Mediterranean" },
  { id: "sp_066", scientific_name: "Coris julis", family: "Labridae", habitat: "marine", notes: "Mediterranean rainbow wrasse" },
  { id: "sp_067", scientific_name: "Serranus scriba", family: "Serranidae", habitat: "marine", notes: "Painted comber, small grouper-like fish" },
  { id: "sp_068", scientific_name: "Serranus cabrilla", family: "Serranidae", habitat: "marine", notes: "Comber, common Mediterranean fish" },
  { id: "sp_069", scientific_name: "Chromis chromis", family: "Pomacentridae", habitat: "marine", notes: "Damselfish, common in Mediterranean reefs" },
  { id: "sp_070", scientific_name: "Lithognathus mormyrus", family: "Sparidae", habitat: "marine", notes: "Striped seabream, sand-dwelling" },
  { id: "sp_071", scientific_name: "Sparisoma cretense", family: "Scaridae", habitat: "marine", notes: "Mediterranean parrotfish" },
  { id: "sp_072", scientific_name: "Muraena helena", family: "Muraenidae", habitat: "marine", notes: "Mediterranean moray eel" },
  { id: "sp_073", scientific_name: "Spicara smaris", family: "Centracanthidae", habitat: "marine", notes: "Picarel, small fish often fried whole" },
  { id: "sp_074", scientific_name: "Epinephelus marginatus", family: "Serranidae", habitat: "marine", notes: "Dusky grouper, prized but now protected" },
  { id: "sp_075", scientific_name: "Conger conger", family: "Congridae", habitat: "marine", notes: "European conger eel" },
  { id: "sp_076", scientific_name: "Xiphias gladius", family: "Xiphiidae", habitat: "marine", notes: "Swordfish" },
  { id: "sp_077", scientific_name: "Thunnus thynnus", family: "Scombridae", habitat: "marine", notes: "Atlantic bluefin tuna" },
  { id: "sp_078", scientific_name: "Zeus faber", family: "Zeidae", habitat: "marine", notes: "John Dory, distinctive round body with dark spot" },
  { id: "sp_079", scientific_name: "Atherina hepsetus", family: "Atherinidae", habitat: "marine", notes: "Mediterranean sand smelt" },
  { id: "sp_080", scientific_name: "Chelidonichthys lastoviza", family: "Triglidae", habitat: "marine", notes: "Streaked gurnard" },
];

const insertSpecies = db.prepare(`
  INSERT OR IGNORE INTO species (id, scientific_name, family, habitat, notes)
  VALUES ($id, $scientific_name, $family, $habitat, $notes)
`);

for (const sp of newSpecies) {
  insertSpecies.run({
    $id: sp.id,
    $scientific_name: sp.scientific_name,
    $family: sp.family,
    $habitat: sp.habitat,
    $notes: sp.notes,
  });
}
console.log(`Added ${newSpecies.length} new species`);

// Greek names (starting from nm_0312)
const greekNames: {
  id: string;
  name: string;
  transliteration: string;
  species_id: string;
  etymology: string;
  phonetic: string;
  notes: string | null;
}[] = [
  {
    id: "nm_0312",
    name: "Γόπα",
    transliteration: "Gópa",
    species_id: "sp_065",
    etymology: "From Ancient Greek γόπα (gópa)",
    phonetic: "ˈɣopa",
    notes: "Small fish, often fried whole",
  },
  {
    id: "nm_0313",
    name: "Γύλος",
    transliteration: "Gýlos",
    species_id: "sp_066",
    etymology: "From Ancient Greek γῦρος (gŷros, round), referring to body shape",
    phonetic: "ˈʝilos",
    notes: "Colorful wrasse, not typically eaten",
  },
  {
    id: "nm_0314",
    name: "Πέρκα",
    transliteration: "Pérka",
    species_id: "sp_067",
    etymology: "From Ancient Greek πέρκη (pérkē, perch)\n↳ Related to Latin perca",
    phonetic: "ˈperka",
    notes: "Painted comber, small reef fish",
  },
  {
    id: "nm_0315",
    name: "Χάνος",
    transliteration: "Chános",
    species_id: "sp_068",
    etymology: "From Ancient Greek χάννη (chánnē, sea perch)",
    phonetic: "ˈxanos",
    notes: "Comber, common in rocky areas",
  },
  {
    id: "nm_0316",
    name: "Καλόγρια",
    transliteration: "Kalógria",
    species_id: "sp_069",
    etymology: "From Greek καλόγρια (nun)\nkaló: good, gria: old woman",
    phonetic: "kaˈloɣria",
    notes: "Named for dark coloration resembling nun's habit",
  },
  {
    id: "nm_0317",
    name: "Μούρμουρα",
    transliteration: "Moúrmoura",
    species_id: "sp_070",
    etymology: "Possibly onomatopoeic, from murmuring sound",
    phonetic: "ˈmurmuɾa",
    notes: "Striped seabream, prized eating fish",
  },
  {
    id: "nm_0318",
    name: "Σκάρος",
    transliteration: "Skáros",
    species_id: "sp_071",
    etymology: "From Ancient Greek σκάρος (skáros, parrotfish)\n↳ Mentioned by Aristotle",
    phonetic: "ˈskaros",
    notes: "Mediterranean parrotfish, historically prized by ancient Greeks",
  },
  {
    id: "nm_0319",
    name: "Σμέρνα",
    transliteration: "Smérna",
    species_id: "sp_072",
    etymology: "From Ancient Greek σμύραινα (smýraina, moray)",
    phonetic: "ˈsmerna",
    notes: "Mediterranean moray, feared but eaten in antiquity",
  },
  {
    id: "nm_0320",
    name: "Μαρίδα",
    transliteration: "Marída",
    species_id: "sp_073",
    etymology: "Diminutive form, possibly from μάρις (máris)",
    phonetic: "maˈriða",
    notes: "Picarel, very popular fried whole in tavernas",
  },
  {
    id: "nm_0321",
    name: "Ροφός",
    transliteration: "Rofós",
    species_id: "sp_074",
    etymology: "From Ancient Greek ῥόφος (rhóphos)",
    phonetic: "roˈfos",
    notes: "Dusky grouper, now protected species in many areas",
  },
  {
    id: "nm_0322",
    name: "Μούγκρι",
    transliteration: "Moúngri",
    species_id: "sp_075",
    etymology: "From Italian dialect, possibly related to mungere (to milk)",
    phonetic: "ˈmuŋɡri",
    notes: "European conger eel",
  },
  {
    id: "nm_0323",
    name: "Ξιφίας",
    transliteration: "Xifías",
    species_id: "sp_076",
    etymology: "From Ancient Greek ξίφος (xíphos, sword) + -ίας suffix\nxíphos: sword",
    phonetic: "ksiˈfias",
    notes: "Swordfish, named for sword-like bill",
  },
  {
    id: "nm_0324",
    name: "Τόνος",
    transliteration: "Tónos",
    species_id: "sp_077",
    etymology: "From Ancient Greek θύννος (thýnnos, tuna)\n↳ From θύνω (thýnō, to rush)",
    phonetic: "ˈtonos",
    notes: "Bluefin tuna, highly valued",
  },
  {
    id: "nm_0325",
    name: "Χριστόψαρο",
    transliteration: "Christópsaro",
    species_id: "sp_078",
    etymology: "Compound: Χριστός + ψάρι\nChristós: Christ, psári: fish",
    phonetic: "xriˈstopsaro",
    notes: "John Dory, named for dark spot said to be St. Peter's thumbprint",
  },
  {
    id: "nm_0326",
    name: "Αθερίνα",
    transliteration: "Atherína",
    species_id: "sp_079",
    etymology: "From Ancient Greek ἀθερίνη (atheríne, sand smelt)",
    phonetic: "aθeˈrina",
    notes: "Sand smelt, fried whole as mezze",
  },
  {
    id: "nm_0327",
    name: "Καπόνι",
    transliteration: "Kapóni",
    species_id: "sp_080",
    etymology: "From Italian capone (big head), referring to large head",
    phonetic: "kaˈponi",
    notes: "Gurnard, used in fish soup",
  },
];

const insertGreek = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
  VALUES ($id, $name, $species_id, 'greek', 'ell', $etymology, $transliteration, $phonetic, $notes)
`);

for (const nm of greekNames) {
  insertGreek.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $etymology: nm.etymology,
    $transliteration: nm.transliteration,
    $phonetic: nm.phonetic,
    $notes: nm.notes,
  });
}
console.log(`Added ${greekNames.length} Greek names`);

// English names for new species
const englishNames: {
  id: string;
  name: string;
  species_id: string;
  etymology: string;
  phonetic: string;
  notes: string | null;
}[] = [
  { id: "nm_0328", name: "Bogue", species_id: "sp_065", etymology: "From French bogue, from Occitan bòga", phonetic: "boʊɡ", notes: "Small Mediterranean seabream" },
  { id: "nm_0329", name: "Mediterranean rainbow wrasse", species_id: "sp_066", etymology: "Named for colorful markings", phonetic: "ˌmedɪtəˈreɪniən ˈreɪnboʊ ræs", notes: null },
  { id: "nm_0330", name: "Painted comber", species_id: "sp_067", etymology: "Named for colorful pattern", phonetic: "ˈpeɪntɪd ˈkoʊmər", notes: null },
  { id: "nm_0331", name: "Comber", species_id: "sp_068", etymology: "Origin uncertain", phonetic: "ˈkoʊmər", notes: null },
  { id: "nm_0332", name: "Damselfish", species_id: "sp_069", etymology: "From damsel (young woman) + fish", phonetic: "ˈdæmzəlˌfɪʃ", notes: null },
  { id: "nm_0333", name: "Striped seabream", species_id: "sp_070", etymology: "Descriptive of appearance", phonetic: "straɪpt ˈsiːbriːm", notes: null },
  { id: "nm_0334", name: "Mediterranean parrotfish", species_id: "sp_071", etymology: "Named for beak-like mouth", phonetic: "ˌmedɪtəˈreɪniən ˈpærətˌfɪʃ", notes: null },
  { id: "nm_0335", name: "Mediterranean moray", species_id: "sp_072", etymology: "From Latin muraena, from Greek μύραινα", phonetic: "ˌmedɪtəˈreɪniən məˈreɪ", notes: null },
  { id: "nm_0336", name: "Picarel", species_id: "sp_073", etymology: "From French picarel", phonetic: "ˈpɪkərəl", notes: "Also called blotched picarel" },
  { id: "nm_0337", name: "Dusky grouper", species_id: "sp_074", etymology: "Dusky (dark) + grouper (from Portuguese garoupa)", phonetic: "ˈdʌski ˈɡruːpər", notes: "Protected species" },
  { id: "nm_0338", name: "European conger", species_id: "sp_075", etymology: "From Latin conger, from Greek γόγγρος (góngros)", phonetic: "ˌjʊərəˈpiːən ˈkɒŋɡər", notes: null },
  { id: "nm_0339", name: "Swordfish", species_id: "sp_076", etymology: "Named for sword-like bill", phonetic: "ˈsɔːrdˌfɪʃ", notes: null },
  { id: "nm_0340", name: "Atlantic bluefin tuna", species_id: "sp_077", etymology: "From Spanish atún, from Arabic التن (at-tun)", phonetic: "ətˈlæntɪk ˈbluːfɪn ˈtuːnə", notes: "Highly prized, overfished" },
  { id: "nm_0341", name: "John Dory", species_id: "sp_078", etymology: "Possibly from French jaune doré (golden yellow)", phonetic: "dʒɒn ˈdɔːri", notes: "Also called St. Peter's fish" },
  { id: "nm_0342", name: "Mediterranean sand smelt", species_id: "sp_079", etymology: "Sand smelt from sandy habitat", phonetic: "ˌmedɪtəˈreɪniən sænd smelt", notes: null },
  { id: "nm_0343", name: "Streaked gurnard", species_id: "sp_080", etymology: "Gurnard from Old French gornart (grunter)", phonetic: "striːkt ˈɡɜːrnərd", notes: "Named for grunting sound" },
];

const insertEnglish = db.prepare(`
  INSERT OR IGNORE INTO names (id, name, species_id, region_id, lang, etymology, phonetic, notes)
  VALUES ($id, $name, $species_id, 'international', 'eng', $etymology, $phonetic, $notes)
`);

for (const nm of englishNames) {
  insertEnglish.run({
    $id: nm.id,
    $name: nm.name,
    $species_id: nm.species_id,
    $etymology: nm.etymology,
    $phonetic: nm.phonetic,
    $notes: nm.notes,
  });
}
console.log(`Added ${englishNames.length} English names`);

// Build relations with existing Turkish names where applicable
// Check for shared species between Greek and Turkish
const sharedSpecies = db.query(`
  SELECT DISTINCT s.id, s.scientific_name,
    (SELECT id FROM names WHERE species_id = s.id AND lang = 'ell' LIMIT 1) as greek_id,
    (SELECT id FROM names WHERE species_id = s.id AND lang = 'tur' LIMIT 1) as turkish_id
  FROM species s
  WHERE EXISTS (SELECT 1 FROM names WHERE species_id = s.id AND lang = 'ell')
    AND EXISTS (SELECT 1 FROM names WHERE species_id = s.id AND lang = 'tur')
`).all() as { id: string; scientific_name: string; greek_id: string; turkish_id: string }[];

console.log(`\nFound ${sharedSpecies.length} species with both Greek and Turkish names`);

// Verify counts
const speciesCount = db.query("SELECT COUNT(*) as count FROM species").get() as { count: number };
const namesCount = db.query("SELECT COUNT(*) as count FROM names").get() as { count: number };
const greekCount = db.query("SELECT COUNT(*) as count FROM names WHERE lang = 'ell'").get() as { count: number };

console.log(`\nTotal species: ${speciesCount.count}`);
console.log(`Total names: ${namesCount.count}`);
console.log(`Greek names: ${greekCount.count}`);

db.close();
