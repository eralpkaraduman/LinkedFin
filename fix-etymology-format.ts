import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Fixes: move context to notes, clean up etymology format
const fixes: { name: string; etymology: string; notes?: string }[] = [
  // Remove redundant trailing "meaning X" from compounds
  {
    name: "Ada beyi",
    etymology: "From Turkish ada (island) + bey (lord)",
    notes: "Literally 'lord of the island'"
  },
  {
    name: "Sarıkanat",
    etymology: "From Turkish sarı (yellow) + kanat (fin)",
    notes: "Literally 'yellow-finned'"
  },
  {
    name: "Sarıkız",
    etymology: "From Turkish sarı (yellow) + kız (girl)",
    notes: "Literally 'yellow girl'"
  },
  {
    name: "Sırtıkara",
    etymology: "From Turkish sırt (back) + kara (black)",
    notes: "Literally 'black-backed'"
  },
  {
    name: "Karakulak",
    etymology: "From Turkish kara (black) + kulak (ear)",
    notes: "Refers to dark gill area"
  },

  // Move context to notes
  {
    name: "حبار",
    etymology: "From Arabic ḥabbār",
    notes: "Term used for both squid and cuttlefish. Named for ink used with reed pens."
  },
  {
    name: "Yaprak",
    etymology: "From Turkish yaprak (leaf)",
    notes: "Refers to smallest size class of bluefish"
  },
  {
    name: "Defneyaprağı",
    etymology: "From Turkish defne (laurel) + yaprak (leaf)",
    notes: "Refers to small bluefish resembling laurel leaf"
  },
  {
    name: "Mavi yengeç",
    etymology: "From Turkish mavi (blue) + yengeç (crab)",
    notes: "Yengeç is Old Turkish (documented 1073). Species is a Mediterranean invasive."
  },
  {
    name: "Mercan",
    etymology: "From Arabic مرجان marjān (coral)",
    notes: "Refers to pink/red color. Used in Aegean/Mediterranean."
  },
  {
    name: "Somon",
    etymology: "From French saumon, from Latin salmo",
    notes: "Not native - farmed in Marmara region"
  },
  {
    name: "Meksinar",
    etymology: "From Greek μικρο-σιναγρίδα mikro-synagrída (small dentex)",
    notes: "Regional Aegean term"
  },
  {
    name: "Kofana",
    etymology: "From Greek γουφαίνα goufaína",
    notes: "Originally meant female bluefish"
  },
  {
    name: "Kötek",
    etymology: "From Turkish dialect",
    notes: "Black Sea dialect name for shi drum (minekop/karakulak)"
  },

  // Clean up derivation chains
  {
    name: "Barbun",
    etymology: "From Greek μπαρμπούνι barboúni\n↳ From Latin barba (beard)",
    notes: "Refers to barbels on chin"
  },
  {
    name: "Ahtapot",
    etymology: "From Greek ὀχτοπόδιον ochtopódion (eight-footed)\n↳ From ὀκτώ októ (eight) + πόδι pódi (foot)"
  },
  {
    name: "Palamut",
    etymology: "From Greek παλαμίδα palamída\n↳ From Ancient Greek πηλαμύς pēlamýs (young tuna)"
  },
  {
    name: "Sardalya",
    etymology: "From Greek σαρδέλα sardéla\n↳ From Latin sardina\n↳ From Sardō (Sardinia island)"
  },
  {
    name: "Kalamar",
    etymology: "From Greek καλαμάριον kalamárion (little reed/pen)",
    notes: "Same root as Arabic قلم qalam and Turkish kalem (pen)"
  },
  {
    name: "Καλαμάρι",
    etymology: "From Greek κάλαμος kálamos (reed/pen)",
    notes: "Refers to the ink, like a reed pen"
  },

  // Fix "From scientific name" entries
  {
    name: "دنتكس",
    etymology: "From Latin dentex (toothy)",
  },
  {
    name: "سلبة",
    etymology: "From Latin Sarpa salpa",
  },
  {
    name: "Σάλπα",
    etymology: "From Latin Sarpa salpa",
  },

  // Fix vague etymologies
  {
    name: "Minekop",
    etymology: "From Italian/Venetian",
    notes: "Regional coastal name for shi drum"
  },
  {
    name: "Çinekop",
    etymology: "Origin uncertain",
    notes: "Bluefish size class (12-18cm)"
  },

  // Clean up "meaning" in quotes format
  {
    name: "مرجان",
    etymology: "From Arabic marjān (coral)",
    notes: "Refers to pink/red color"
  },
  {
    name: "جمبري",
    etymology: "From Arabic gambarī (shrimp)",
    notes: "Italian gambero influence"
  },
  {
    name: "قريدس",
    etymology: "From Arabic quraydis (shrimp)"
  },
  {
    name: "كركند",
    etymology: "From Arabic karkand (lobster)"
  },
  {
    name: "شفنين",
    etymology: "From Arabic shafnīn (ray/skate)"
  },
  {
    name: "Αστακός",
    etymology: "From Greek astakós (lobster)",
    notes: "Related to word for bone"
  },
  {
    name: "Βάτος",
    etymology: "From Greek bátos (thorny shrub)",
    notes: "Extended to ray fish due to spiky appearance"
  },
  {
    name: "Γαρίδα",
    etymology: "From Greek garída (shrimp)"
  },
  {
    name: "Χταπόδι",
    etymology: "From Greek chtapódi (eight-footed)"
  },
  {
    name: "دنتكس كبير العين",
    etymology: "From Arabic dintiks (dentex) + kabīr al-ʿayn (large-eyed)"
  },
  {
    name: "Συναγρίδα μεγαλόφθαλμη",
    etymology: "From Greek synagrída (dentex) + megalófthalmi (large-eyed)"
  },
  {
    name: "Συναγρίδα",
    etymology: "From Greek synagrída",
    notes: "Ancient name for this fish"
  },
];

const updateEtymology = db.prepare("UPDATE names SET etymology = ? WHERE name = ?");
const updateBoth = db.prepare("UPDATE names SET etymology = ?, notes = ? WHERE name = ?");
const getExisting = db.prepare("SELECT notes FROM names WHERE name = ?");

let fixed = 0;

for (const fix of fixes) {
  const existing = getExisting.get(fix.name) as { notes: string | null } | null;

  if (fix.notes) {
    // Append to existing notes if any
    const newNotes = existing?.notes
      ? `${existing.notes} ${fix.notes}`
      : fix.notes;
    updateBoth.run(fix.etymology, newNotes, fix.name);
  } else {
    updateEtymology.run(fix.etymology, fix.name);
  }
  console.log(`✓ ${fix.name}`);
  fixed++;
}

console.log(`\nFixed ${fixed} etymologies.`);
db.close();
