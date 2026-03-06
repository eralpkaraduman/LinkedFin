import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Manual fixes for awkward reformatted etymologies
const fixes: Record<string, string> = {
  // Fix double language mentions
  "Mavi yengeç": "From Turkish mavi (blue) + yengeç (crab). Yengeç is Old Turkish (documented 1073). Species is a Mediterranean invasive.",
  "Karakulak": "From Turkish kara (black) + kulak (ear), referring to dark gill area",

  // Fix awkward "meaning" usage
  "Σκαθάρι": "From Greek skathári, also called μελανούρι (melanouri)",
  "Γλώσσα": "From Greek glóssa meaning 'tongue', same concept as Turkish dil balığı",
  "دنيس": "From Arabic dinnīs, widespread name for gilt-head bream",
  "بوري": "From Arabic būrī, widespread name for grey mullet",
  "Κουτσομούρα": "From Greek koutsomoúra, the striped red mullet",
  "سلطان ابراهيم": "From Arabic sulṭān ibrāhīm (Sultan Ibrahim), origin uncertain, possibly Ottoman era honorific",
  "Λυθρίνι": "From Greek lythríni, traditional name for common pandora",
  "Μουσμούλι": "From Greek mousmoúli, traditional name for axillary seabream",
  "Χέλι": "From Greek chéli, traditional name for European eel",
  "Καβούρι": "From Greek kavoúri meaning 'crab'",
  "Μυλοκόπι": "From Greek mylokópi meaning 'mill-cutter', traditional name for shi drum",
  "غراب": "From Arabic ghurāb meaning 'crow/raven', name for shi drum",
  "شرغو": "From Arabic sharghu, traditional name for annular seabream",
  "صوريل": "From Arabic ṣawrīl, traditional name for horse mackerel",
  "Σφυρίδα": "From Greek sfyrída, traditional name for white grouper",
  "وقار": "From Arabic waqqār, traditional name for grouper",

  // Fix description etymologies
  "Shi drum": "From English, onomatopoeic term referring to the drumming sounds it makes",
  "European squid": "From English, scientific common name. Etymology uncertain.",
  "Gilthead seabream": "From English, referring to the golden stripe between the eyes",
  "Axillary seabream": "From English, referring to the dark spot near the pectoral fin (axil)",
  "Atlantic horse mackerel": "From English 'horse' indicating larger/coarser than regular mackerel",

  // Fix origin chain etymologies
  "بربون": "From Arabic barbūn, borrowed from Greek/Latin barba (beard)",
  "كلماري": "From Arabic kalamārī, borrowed from Greek/Italian calamari",
  "Καλαμάρι": "From Greek kalamári, from κάλαμος (kalamos) meaning 'reed/pen', referring to the ink",
  "Κέφαλος": "From Greek képhalos, from κεφαλή (kephalē) meaning 'head'",
  "Σαυρίδι": "From Greek savrίdi, from σαῦρος (sauros) meaning 'lizard'",
  "Σπάρος": "From Greek spáros, ancient Greek fish name",

  // Fix compound word etymologies
  "Yaprak": "From Turkish yaprak meaning 'leaf', refers to smallest size class of bluefish",
  "Defneyaprağı": "From Turkish defne (laurel) + yaprağı (leaf), refers to small bluefish resembling laurel leaf",
  "Ada beyi": "From Turkish ada (island) + bey (lord), meaning 'lord of the island'",
  "Sarıkız": "From Turkish sarı (yellow) + kız (girl), meaning 'yellow girl'",
  "Dil balığı": "From Turkish dil (tongue) + balık (fish), referring to flat shape",
  "Yılan balığı": "From Turkish yılan (snake) + balığı (fish). Yılan from Old Turkish (pre-900 CE).",
  "Sırtıkara": "From Turkish sırt (back) + kara (black), meaning 'black-backed'",
  "Sarıkanat": "From Turkish sarı (yellow) + kanat (fin), meaning 'yellow-finned'",
  "Kaba lidaki": "From Greek λιθάκι (lithaki) + Turkish kaba (coarse/large)",

  // Fix contested/uncertain etymologies
  "Çipura": "Etymology contested. Nişanyan suggests Turkish çupra (fish bone) → Greek. Greek dictionaries cite Ancient Greek ἵππουρος (hippouros).",
  "Τσιπούρα": "From Greek tsipοúra, etymology contested between Turkish and Ancient Greek origins",
  "Kötek": "From Turkish, Black Sea dialect name for shi drum (minekop/karakulak)",
};

const update = db.prepare("UPDATE names SET etymology = ? WHERE id = ?");
let fixed = 0;

for (const [name, etymology] of Object.entries(fixes)) {
  const result = db.query("SELECT id FROM names WHERE name = ?").get(name) as { id: string } | null;
  if (result) {
    update.run(etymology, result.id);
    console.log(`✓ ${name}`);
    fixed++;
  } else {
    console.log(`✗ ${name} not found`);
  }
}

console.log(`\nFixed ${fixed} etymologies.`);
db.close();
