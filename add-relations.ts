import { Database } from "bun:sqlite";

const db = new Database("fish.db");

// borrowed_from: source borrowed from target
// Turkish ← Greek borrowings (same species, clear etymological connection)
const borrowedFrom: [string, string, string][] = [
  // [borrower_id, source_id, notes]
  ["nm_0005", "nm_0007", "Sinarit from Greek Συναγρίδα"],
  ["nm_0014", "nm_0015", "Barbun from Greek Μπαρμπούνι"],
  ["nm_0023", "nm_0024", "Lüfer from Greek Γοφάρι"],
  ["nm_0056", "nm_0057", "Kefal from Greek Κέφαλος"],
  ["nm_0065", "nm_0066", "Palamut from Greek Παλαμίδα"],
  ["nm_0073", "nm_0075", "Ispanoz from Greek Σπάρος"],
  ["nm_0078", "nm_0079", "Istavrit from Greek Σαυρίδι"],
  ["nm_0087", "nm_0088", "Vatoz from Greek Βάτος"],
  ["nm_0091", "nm_0092", "Istakoz from Greek Αστακός"],
  ["nm_0096", "nm_0097", "Ahtapot from Greek Χταπόδι"],
  ["nm_0100", "nm_0101", "Karides from Greek Γαρίδα"],
  ["nm_0114", "nm_0115", "Kerevit from Greek Καραβίδα"],
  ["nm_0118", "nm_0119", "Kalamar from Greek Καλαμάρι"],
  ["nm_0123", "nm_0124", "Sübye from Greek Σουπιά"],
  ["nm_0128", "nm_0129", "Sardalya from Greek Σαρδέλα"],

  // Arabic ← Greek borrowings
  ["nm_0016", "nm_0015", "بربون from Greek Μπαρμπούνι via barbūn"],
  ["nm_0067", "nm_0066", "بلاميطة from Greek Παλαμίδα"],
  ["nm_0098", "nm_0097", "أخطبوط from Greek októpous"],
  ["nm_0121", "nm_0119", "كلماري from Greek Καλαμάρι"],
];

// confused_with: names that refer to different species but are commonly confused
const confusedWith: [string, string, string][] = [
  // [name1_id, name2_id, notes]
  ["nm_0120", "nm_0125", "حبار used for both squid (Loligo) and cuttlefish (Sepia)"],
];

const insert = db.prepare(
  "INSERT OR IGNORE INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)"
);

let added = 0;

console.log("Adding borrowed_from relations...");
for (const [source, target, notes] of borrowedFrom) {
  insert.run(source, target, "borrowed_from", notes);
  console.log(`  ✓ ${notes}`);
  added++;
}

console.log("\nAdding confused_with relations...");
for (const [source, target, notes] of confusedWith) {
  // Add both directions for bidirectional relation
  insert.run(source, target, "confused_with", notes);
  console.log(`  ✓ ${notes}`);
  added++;
}

console.log(`\nAdded ${added} relations.`);
db.close();
