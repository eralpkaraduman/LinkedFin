/**
 * Explain Greek word meanings in nm_0005 and nm_0006 etymologies
 *
 * GitHub Issue #35: https://github.com/eralpkaraduman/LinkedFin/issues/35
 *
 * Problem:
 * - nm_0005 (Sinarit) and nm_0006 (Sinağrit) etymologies say
 *   "From Greek συναγρίδα synagrída (dentex)" without explaining
 *   what the Greek words actually mean in English.
 *
 * Solution:
 * - Expand etymologies to trace through Ancient Greek and explain
 *   the component words σύν (together) + ἄγρα (hunting, catch),
 *   matching the pattern already used by nm_0007 and nm_0385.
 */
import Database from "better-sqlite3";

const db = new Database("public/fish.db");

console.log("=== Fixing nm_0005 and nm_0006 etymologies (Issue #35) ===\n");

// Show current state
const currentNames = db
	.prepare(
		"SELECT id, name, lang, etymology FROM names WHERE id IN ('nm_0005', 'nm_0006')",
	)
	.all() as { id: string; name: string; lang: string; etymology: string }[];
console.log("Current etymologies:");
for (const n of currentNames) {
	console.log(`  ${n.id} (${n.name}): ${n.etymology}`);
}

// 1. Update nm_0005 (Sinarit)
db.prepare(`UPDATE names SET etymology = ? WHERE id = 'nm_0005'`).run(
	"From Greek συναγρίδα synagrída (dentex)\n↳ From Ancient Greek συναγρίς synagrís, from σύν sýn (together) + ἄγρα ágra (hunting, catch) - referring to their schooling hunting behavior",
);
console.log("\nUpdated nm_0005 (Sinarit) etymology");

// 2. Update nm_0006 (Sinağrit)
db.prepare(`UPDATE names SET etymology = ? WHERE id = 'nm_0006'`).run(
	"From Greek συναγρίδα synagrída (dentex)\n↳ From Ancient Greek συναγρίς synagrís, from σύν sýn (together) + ἄγρα ágra (hunting, catch) - referring to their schooling hunting behavior",
);
console.log("Updated nm_0006 (Sinağrit) etymology");

// Verify
console.log("\n=== Verification ===");
const updatedNames = db
	.prepare(
		"SELECT id, name, lang, etymology FROM names WHERE id IN ('nm_0005', 'nm_0006')",
	)
	.all() as { id: string; name: string; lang: string; etymology: string }[];
for (const n of updatedNames) {
	console.log(`\n${n.id} (${n.name}):`);
	console.log(`  Etymology: ${n.etymology}`);
}

// Also show nm_0007 for comparison
const nm0007 = db
	.prepare("SELECT id, name, etymology FROM names WHERE id = 'nm_0007'")
	.get() as { id: string; name: string; etymology: string };
console.log(`\nFor comparison, nm_0007 (${nm0007.name}):`);
console.log(`  Etymology: ${nm0007.etymology}`);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:verify");

db.close();
