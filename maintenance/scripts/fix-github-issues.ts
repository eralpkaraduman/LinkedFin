/**
 * Fix GitHub issues #6, #7, #11
 * - Add English name "Leerfish" for Akya (sp_085)
 * - Add confused_with relation: Akya ↔ Sarıkuyruk
 * - Add Tombik name for Sarda sarda and confused_with for Sivri
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

// Get next name ID
const maxIdResult = db.query("SELECT MAX(id) as max FROM names").get() as {
	max: string;
};
const nextIdNum =
	Number.parseInt(maxIdResult.max.replace("nm_", ""), 10) + 1;
const nextId = (offset = 0) =>
	`nm_${String(nextIdNum + offset).padStart(4, "0")}`;

console.log(`Next available ID: ${nextId()}`);

// Issue #6 & #7: Add English name "Leerfish" for Lichia amia (sp_085)
const leerfishId = nextId(0);
console.log(`\n=== Issue #6 & #7: Adding Leerfish (${leerfishId}) ===`);

const insertName = db.prepare(`
  INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertName.run(
	leerfishId,
	"Leerfish",
	"sp_085",
	"international",
	"eng",
	'From Dutch leervis (leather fish), referring to tough skin',
	"Leerfish",
	"[leerfish]",
	"Also called Garrick in South Africa. Prized game fish."
);
console.log(`  ✓ Added: Leerfish (${leerfishId})`);

// Issue #7: Add confused_with relation: Akya ↔ Sarıkuyruk
console.log(`\n=== Adding confused_with relation ===`);
const insertRelation = db.prepare(`
  INSERT OR IGNORE INTO name_relations (source_id, target_id, relation, notes)
  VALUES (?, ?, ?, ?)
`);

// Akya (nm_0199) confused with Sarıkuyruk (nm_0396)
insertRelation.run(
	"nm_0199",
	"nm_0396",
	"confused_with",
	"Fishermen often call Sarıkuyruk 'Akya' because true Akya is rare"
);
console.log("  ✓ Added: Akya ↔ Sarıkuyruk confused_with relation");

// Issue #11: Add Tombik name for Sarda sarda (sp_014)
const tombikId = nextId(1);
console.log(`\n=== Issue #11: Adding Tombik (${tombikId}) ===`);

insertName.run(
	tombikId,
	"Tombik",
	"sp_014",
	"turkish-blacksea",
	"tur",
	'From Turkish tombik (chubby, rounded)',
	"Tombik",
	"/tombik/",
	"Rounder body variant name, often confused with Sivri at fish markets"
);
console.log(`  ✓ Added: Tombik (${tombikId})`);

// Add confused_with relation: Sivri ↔ Tombik
insertRelation.run(
	"nm_0252",
	tombikId,
	"confused_with",
	"Often confused at fish markets - Sivri has pointed snout, Tombik is rounder"
);
console.log("  ✓ Added: Sivri ↔ Tombik confused_with relation");

// Update Sivri notes to reference the new Tombik record
const updateNote = db.prepare(`UPDATE names SET notes = ? WHERE id = ?`);
updateNote.run("Pointed snout variant. See also Tombik for rounder variant.", "nm_0252");
console.log("  ✓ Updated Sivri notes");

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:validate");

db.close();
