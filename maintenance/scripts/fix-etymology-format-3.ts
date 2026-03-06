import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Final cleanup pass
const fixes: { name: string; etymology: string; notes?: string }[] = [
  {
    name: "Dil balığı",
    etymology: "From Turkish dil (tongue) + balık (fish)",
    notes: "Refers to flat shape"
  },
  {
    name: "Ispanoz",
    etymology: "From Greek σπάρος spáros via Turkish vowel epenthesis",
    notes: "σπ- → isp-"
  },
  {
    name: "Istakoz",
    etymology: "From Latin astacus\n↳ From Greek ἀστακός astakós (large sea creature/lobster)"
  },
  {
    name: "Istavrit",
    etymology: "From Greek σαυρίδιον savridion\n↳ From σαῦρος saûros (lizard)"
  },
  {
    name: "Karides",
    etymology: "From Greek καρίδες karídes (sea insect)",
    notes: "Plural of καρίδα karída"
  },
  {
    name: "Kefal",
    etymology: "From Greek κέφαλος képhalos\n↳ From κεφαλή kephalḗ (head)"
  },
  {
    name: "Kerevit",
    etymology: "From Greek καραβίδα karavída (small lobster)",
    notes: "Used for freshwater crayfish in lakes"
  },
  {
    name: "Mavraki",
    etymology: "From Greek μαύρο mávro (black)"
  },
  {
    name: "Pavurya",
    etymology: "From Greek παγούρια pagoúria\n↳ From Ancient Greek πάγουρος págouros (stiff tail)"
  },
  {
    name: "Sübye",
    etymology: "From Greek σηπία sēpía / σουπιά soupiá (cuttlefish/ink fish)"
  },
  {
    name: "Tekir",
    etymology: "From Greek τίγρις tígris (tiger)",
    notes: "Refers to striped pattern"
  },
  {
    name: "Vatoz",
    etymology: "From Greek βάτος bátos (thorny shrub/blackberry)",
    notes: "Also means 'ray fish with spiky tail'"
  },
  {
    name: "Yılan balığı",
    etymology: "From Turkish yılan (snake) + balık (fish)",
    notes: "Yılan from Old Turkish (pre-900 CE)"
  },
  {
    name: "Çipura",
    etymology: "Etymology contested",
    notes: "Nişanyan suggests Turkish çupra (fish bone) → Greek. Greek dictionaries cite Ancient Greek ἵππουρος hippouros."
  },
  {
    name: "Lidaki",
    etymology: "From Greek λιθάκι lithaki (little stone)"
  },
  {
    name: "Ince lidaki",
    etymology: "From Greek λιθάκι lithaki (little stone) + Turkish ince (thin)"
  },
  {
    name: "Kaba lidaki",
    etymology: "From Greek λιθάκι lithaki (little stone) + Turkish kaba (coarse/large)"
  },
  {
    name: "Lüfer",
    etymology: "From Greek γουφάρι goufári / λουφάρι loufári"
  },

  // English entries - make consistent
  {
    name: "Large-eye dentex",
    etymology: "Descriptive English name",
    notes: "Refers to large eyes"
  },
  {
    name: "Red mullet",
    etymology: "Descriptive English name",
    notes: "Refers to red color"
  },
  {
    name: "Striped red mullet",
    etymology: "Descriptive English name",
    notes: "Red with stripes"
  },
  {
    name: "White grouper",
    etymology: "Descriptive English name",
    notes: "Refers to lighter coloring"
  },
  {
    name: "Black seabream",
    etymology: "Descriptive English name",
    notes: "Refers to dark color"
  },
  {
    name: "Blue crab",
    etymology: "Descriptive English name",
    notes: "Blue coloring"
  },
  {
    name: "Bluefish",
    etymology: "Descriptive English name",
    notes: "Refers to blue-green color"
  },
  {
    name: "Brown crab",
    etymology: "Descriptive English name",
    notes: "Brown coloring"
  },
  {
    name: "Flathead grey mullet",
    etymology: "Descriptive English name",
    notes: "Flat head shape"
  },
  {
    name: "Thornback ray",
    etymology: "Descriptive English name",
    notes: "Refers to thorny spines on back"
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
