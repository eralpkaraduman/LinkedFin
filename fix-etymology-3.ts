import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// Fix redundant "meaning X" where X is just the English translation
const fixes: Record<string, string> = {
  // Arabic compound descriptives
  "سلطعون أزرق": "From Arabic sulṭaʿūn (crab) + azraq (blue), descriptive compound",
  "سمك أزرق": "From Arabic samak (fish) + azraq (blue), descriptive compound",
  "دنيس أسود": "From Arabic dinnīs (sea bream) + aswad (black), descriptive compound",
  "مرجان صغير": "From Arabic marjān (coral/pandora) + ṣaghīr (small), descriptive compound",
  "بربون مخطط": "From Arabic barbūn (mullet) + mukhaṭṭaṭ (striped), descriptive compound",
  "ثعبان البحر": "From Arabic thuʿbān (snake) + al-baḥr (the sea), literally 'sea snake'",
  "جراد البحر": "From Arabic jarād (locust) + al-baḥr (the sea), literally 'sea locust'",
  "جراد النهر": "From Arabic jarād (locust) + al-nahr (the river), literally 'river locust'",
  "سمك موسى": "From Arabic samak (fish) + mūsā (Moses). Legend: fish split by Moses parting the Red Sea",

  // Greek compound descriptives
  "Μπλε καβούρι": "From Greek ble (blue) + kavoúri (crab), descriptive compound",

  // Simple translations that need context
  "Καβούρι": "From Greek kavoúri, traditional name for crab",
  "سلطعون": "From Arabic sulṭaʿūn, formal term for crab",
  "كابوريا": "From Arabic kābūryā, colloquial Egyptian term for crab",
  "Καραβίδα": "From Greek karavída, traditional name for freshwater crayfish",
  "حبار": "From Arabic ḥabbār, term used for both squid and cuttlefish",
  "Σουπιά": "From Greek soupiá, from Ancient Greek σηπία (sēpía) meaning ink-fish",
  "سبيط": "From Arabic sabbīṭ, Egyptian term for cuttlefish",
};

const update = db.prepare("UPDATE names SET etymology = ? WHERE id = ?");
let fixed = 0;

for (const [name, etymology] of Object.entries(fixes)) {
  const results = db.query("SELECT id FROM names WHERE name = ?").all(name) as { id: string }[];
  for (const { id } of results) {
    update.run(etymology, id);
    console.log(`✓ ${name}`);
    fixed++;
  }
}

console.log(`\nFixed ${fixed} etymologies.`);
db.close();
