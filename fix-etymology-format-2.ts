import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// More fixes: move "traditional name", "formal term", etc. to notes
const fixes: { name: string; etymology: string; notes?: string }[] = [
  // Move "widespread/traditional/formal name" context to notes
  {
    name: "بوري",
    etymology: "From Arabic būrī",
    notes: "Widespread name for grey mullet"
  },
  {
    name: "سلطعون",
    etymology: "From Arabic sulṭaʿūn",
    notes: "Formal term for crab"
  },
  {
    name: "سبيط",
    etymology: "From Arabic sabbīṭ",
    notes: "Egyptian term for cuttlefish"
  },
  {
    name: "كابوريا",
    etymology: "From Arabic kābūryā",
    notes: "Colloquial Egyptian term for crab"
  },
  {
    name: "شرغو",
    etymology: "From Arabic sharghu",
    notes: "Traditional name for annular seabream"
  },
  {
    name: "صوريل",
    etymology: "From Arabic ṣawrīl",
    notes: "Traditional name for horse mackerel"
  },
  {
    name: "وقار",
    etymology: "From Arabic waqqār",
    notes: "Traditional name for grouper"
  },
  {
    name: "Καβούρι",
    etymology: "From Greek kavoúri",
    notes: "Traditional name for crab"
  },
  {
    name: "Καραβίδα",
    etymology: "From Greek karavída",
    notes: "Traditional name for freshwater crayfish"
  },
  {
    name: "Κουτσομούρα",
    etymology: "From Greek koutsomoúra",
    notes: "The striped red mullet"
  },
  {
    name: "Λυθρίνι",
    etymology: "From Greek lythríni",
    notes: "Traditional name for common pandora"
  },
  {
    name: "Μουσμούλι",
    etymology: "From Greek mousmoúli",
    notes: "Traditional name for axillary seabream"
  },
  {
    name: "Σπάρος",
    etymology: "From Greek spáros",
    notes: "Ancient Greek fish name"
  },
  {
    name: "Σφυρίδα",
    etymology: "From Greek sfyrída",
    notes: "Traditional name for white grouper"
  },
  {
    name: "Χέλι",
    etymology: "From Greek chéli",
    notes: "Traditional name for European eel"
  },
  {
    name: "دنيس",
    etymology: "From Arabic dinnīs",
    notes: "Widespread name for gilt-head bream"
  },

  // Remove "descriptive compound" and "literally" from etymology
  {
    name: "بربون مخطط",
    etymology: "From Arabic barbūn (mullet) + mukhaṭṭaṭ (striped)"
  },
  {
    name: "دنيس أسود",
    etymology: "From Arabic dinnīs (sea bream) + aswad (black)"
  },
  {
    name: "سلطعون أزرق",
    etymology: "From Arabic sulṭaʿūn (crab) + azraq (blue)"
  },
  {
    name: "سمك أزرق",
    etymology: "From Arabic samak (fish) + azraq (blue)"
  },
  {
    name: "مرجان صغير",
    etymology: "From Arabic marjān (coral/pandora) + ṣaghīr (small)"
  },
  {
    name: "Μπλε καβούρι",
    etymology: "From Greek ble (blue) + kavoúri (crab)"
  },
  {
    name: "ثعبان البحر",
    etymology: "From Arabic thuʿbān (snake) + al-baḥr (the sea)",
    notes: "Literally 'sea snake'"
  },
  {
    name: "جراد البحر",
    etymology: "From Arabic jarād (locust) + al-baḥr (the sea)",
    notes: "Literally 'sea locust'"
  },
  {
    name: "جراد النهر",
    etymology: "From Arabic jarād (locust) + al-nahr (the river)",
    notes: "Literally 'river locust'"
  },

  // Fix "meaning X" format
  {
    name: "Γλώσσα",
    etymology: "From Greek glóssa (tongue)",
    notes: "Same concept as Turkish dil balığı"
  },
  {
    name: "Μυλοκόπι",
    etymology: "From Greek mylokópi (mill-cutter)",
    notes: "Traditional name for shi drum"
  },
  {
    name: "غراب",
    etymology: "From Arabic ghurāb (crow/raven)",
    notes: "Name for shi drum"
  },

  // Fix legend in etymology
  {
    name: "سمك موسى",
    etymology: "From Arabic samak (fish) + mūsā (Moses)",
    notes: "Legend: fish split by Moses parting the Red Sea"
  },

  // Fix quotes and colon format
  {
    name: "Σαρδέλα",
    etymology: "From Greek sardéla\n↳ From Latin sardina (Sardinia)"
  },
  {
    name: "سلطان ابراهيم",
    etymology: "From Arabic sulṭān ibrāhīm",
    notes: "Origin uncertain, possibly Ottoman era honorific"
  },

  // Clean up remaining inconsistencies
  {
    name: "Κέφαλος",
    etymology: "From Greek képhalos\n↳ From κεφαλή kephalḗ (head)"
  },
  {
    name: "Σαυρίδι",
    etymology: "From Greek savrídi\n↳ From σαῦρος saûros (lizard)"
  },
  {
    name: "Σκαθάρι",
    etymology: "From Greek skathári",
    notes: "Also called μελανούρι melanoúri"
  },
  {
    name: "Σουπιά",
    etymology: "From Greek soupiá\n↳ From Ancient Greek σηπία sēpía (ink-fish)"
  },
  {
    name: "Γοφάρι",
    etymology: "From Ancient Greek γόμφος gómphos (nail/peg)"
  },
  {
    name: "Παλαμίδα",
    etymology: "From Ancient Greek πηλαμύς pēlamýs (young tuna)"
  },
];

const updateEtymology = db.prepare("UPDATE names SET etymology = ? WHERE name = ?");
const updateBoth = db.prepare("UPDATE names SET etymology = ?, notes = ? WHERE name = ?");
const getExisting = db.prepare("SELECT notes FROM names WHERE name = ?");

let fixed = 0;

for (const fix of fixes) {
  const existing = getExisting.get(fix.name) as { notes: string | null } | null;

  if (fix.notes !== undefined) {
    // Replace notes entirely or set new
    updateBoth.run(fix.etymology, fix.notes, fix.name);
  } else {
    updateEtymology.run(fix.etymology, fix.name);
  }
  console.log(`✓ ${fix.name}`);
  fixed++;
}

console.log(`\nFixed ${fixed} etymologies.`);
db.close();
