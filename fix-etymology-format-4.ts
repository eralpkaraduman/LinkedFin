import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Fix format: "meaning X" → "(X)", move context to notes
const fixes: { name: string; etymology: string; notes?: string }[] = [
  // Fix "meaning X" and "= X" formats
  {
    name: "Common dentex",
    etymology: "From Latin dens (tooth)"
  },
  {
    name: "Atlantic bonito",
    etymology: "From Spanish/Portuguese bonito (pretty)"
  },
  {
    name: "Atlantic salmon",
    etymology: "From Latin salmo (leaper)"
  },
  {
    name: "Common octopus",
    etymology: "From Greek ὀκτώπους októpous (eight feet)"
  },
  {
    name: "Common cuttlefish",
    etymology: "From Latin sepia (cuttlefish)"
  },
  {
    name: "European pilchard",
    etymology: "From Latin sardina",
    notes: "Named for fish from Sardinia"
  },
  {
    name: "Annular seabream",
    etymology: "From Latin annulus (ring)",
    notes: "Named for dark ring-shaped spot on tail"
  },

  // Move context from etymology to notes
  {
    name: "Gilthead seabream",
    etymology: "From English gilt (gold) + head",
    notes: "Named for golden stripe between the eyes"
  },
  {
    name: "Common sole",
    etymology: "From Latin solea (sandal)",
    notes: "Named for flat shape resembling a sandal"
  },
  {
    name: "Axillary seabream",
    etymology: "From Latin axilla (armpit)",
    notes: "Named for dark spot near pectoral fin (axil)"
  },
  {
    name: "Atlantic horse mackerel",
    etymology: "From English horse + mackerel",
    notes: "Horse indicates larger/coarser than regular mackerel"
  },

  // Fix vague etymologies
  {
    name: "Common pandora",
    etymology: "From Greek Πανδώρα Pandṓra",
    notes: "Named after Pandora from Greek mythology"
  },
  {
    name: "Caramote prawn",
    etymology: "Origin uncertain",
    notes: "Name from various Mediterranean languages"
  },
  {
    name: "European squid",
    etymology: "Origin uncertain"
  },

  // Fix borrowing chains
  {
    name: "بربون",
    etymology: "From Greek μπαρμπούνι barboúni\n↳ From Latin barba (beard)"
  },
  {
    name: "Τσιπούρα",
    etymology: "From Greek tsipοúra",
    notes: "Etymology contested between Turkish çupra and Ancient Greek ἵππουρος hippouros"
  },
  {
    name: "Somon",
    etymology: "From French saumon (salmon)\n↳ From Latin salmo (leaper)",
    notes: "Not native - farmed in Marmara region"
  },
  {
    name: "كلماري",
    etymology: "From Greek καλαμάριον kalamárion (little reed)\n↳ Via Italian calamari"
  },
  {
    name: "European crayfish",
    etymology: "From Old French crevice (crayfish)"
  },

  // Fix Greek original forms
  {
    name: "أخطبوط",
    etymology: "From Greek ὀκτώπους októpous (eight-footed)"
  },
];

const updateEtymology = db.prepare("UPDATE names SET etymology = ? WHERE name = ?");
const updateBoth = db.prepare("UPDATE names SET etymology = ?, notes = ? WHERE name = ?");

let fixed = 0;

for (const fix of fixes) {
  if (fix.notes !== undefined) {
    updateBoth.run(fix.etymology, fix.notes, fix.name);
  } else {
    updateEtymology.run(fix.etymology, fix.name);
  }
  console.log(`✓ ${fix.name}`);
  fixed++;
}

console.log(`\nFixed ${fixed} etymologies.`);
db.close();
