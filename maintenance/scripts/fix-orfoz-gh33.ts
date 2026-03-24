/**
 * Fix nm_0182 Orfoz self-confusion note and clarify relations
 *
 * GitHub Issue #33: https://github.com/eralpkaraduman/LinkedFin/issues/33
 *
 * Problem:
 * - sp_007 (E. aeneus) note says "Often confused with orfoz (E. marginatus)"
 *   but "orfoz" is the Turkish name for E. aeneus itself, reading as self-confusion
 * - Note also says "lagos (E. costae)" but Lagos (nm_0187) is mapped as an
 *   alternate name for Orfoz (E. aeneus), not as a name for E. costae
 *
 * Solution:
 * 1. Rewrite sp_007 notes to clarify the confusion is with E. marginatus
 *    (Greek ροφός/ὀρφός shares the same etymological root as Turkish orfoz)
 *    and with E. costae (goldblotch grouper, a third Epinephelus species)
 * 2. Existing confused_with relation nm_0182 -> nm_0321 (Ροφός) is correct
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Fixing sp_007 Orfoz self-confusion (Issue #33) ===\n");

// Show current state
const currentSpecies = db
	.query("SELECT id, scientific_name, notes FROM species WHERE id = 'sp_007'")
	.get() as { id: string; scientific_name: string; notes: string };
console.log("Current sp_007 notes:", currentSpecies.notes);

const currentRelations = db
	.query(
		"SELECT source_id, target_id, relation, notes FROM name_relations WHERE source_id = 'nm_0182' OR target_id = 'nm_0182'",
	)
	.all() as { source_id: string; target_id: string; relation: string; notes: string }[];
console.log("\nCurrent relations for nm_0182:");
for (const r of currentRelations) {
	console.log(`  ${r.source_id} -> ${r.target_id} (${r.relation}): ${r.notes}`);
}

// 1. Fix species notes - clarify the confusion without self-referencing "orfoz"
db.run(`UPDATE species SET notes = ? WHERE id = 'sp_007'`, [
	"White grouper. Often confused with E. marginatus (dusky grouper, Greek ροφός — same root as Turkish orfoz) and E. costae (goldblotch grouper). Found around Aegean islands.",
]);
console.log("\nUpdated sp_007 notes");

// Verify
console.log("\n=== Verification ===");
const updatedSpecies = db
	.query("SELECT id, scientific_name, notes FROM species WHERE id = 'sp_007'")
	.get() as { id: string; scientific_name: string; notes: string };
console.log("sp_007 notes:", updatedSpecies.notes);

const relations = db
	.query(
		"SELECT source_id, target_id, relation, notes FROM name_relations WHERE source_id = 'nm_0182' OR target_id = 'nm_0182'",
	)
	.all() as { source_id: string; target_id: string; relation: string; notes: string }[];
console.log("\nRelations for nm_0182:");
for (const r of relations) {
	console.log(`  ${r.source_id} -> ${r.target_id} (${r.relation}): ${r.notes}`);
}

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:verify");

db.close();
