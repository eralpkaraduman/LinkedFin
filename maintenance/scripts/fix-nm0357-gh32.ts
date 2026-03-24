/**
 * Fix nm_0357 "Ρέγγα του Πόντου" region from international to greek
 *
 * GitHub Issue #32: https://github.com/eralpkaraduman/LinkedFin/issues/32
 *
 * Problem:
 * - nm_0357 "Ρέγγα του Πόντου" (Alosa pontica) is marked as region "international"
 *   but it is a Greek name meaning "Herring of Pontus"
 * - The actual international English name "Pontic shad" (nm_0242) already exists
 *
 * Solution:
 * - Change nm_0357 region_id from "international" to "greek"
 */
import { Database } from "bun:sqlite";

const db = new Database("fish.db");

console.log("=== Fixing nm_0357 region (Issue #32) ===\n");

// Show current state
const current = db
	.query(
		"SELECT id, name, region_id, lang FROM names WHERE species_id = 'sp_060'",
	)
	.all() as { id: string; name: string; region_id: string; lang: string }[];
console.log("Current names for sp_060 (Alosa pontica):");
for (const n of current) {
	console.log(`  ${n.id} (${n.lang}, ${n.region_id}): ${n.name}`);
}

// Fix nm_0357 region from "international" to "greek"
db.run(`UPDATE names SET region_id = 'greek' WHERE id = 'nm_0357'`);
console.log("\nUpdated nm_0357 region_id: international -> greek");

// Verify
console.log("\n=== Verification ===");
const updated = db
	.query(
		"SELECT id, name, region_id, lang FROM names WHERE species_id = 'sp_060'",
	)
	.all() as { id: string; name: string; region_id: string; lang: string }[];
for (const n of updated) {
	console.log(`  ${n.id} (${n.lang}, ${n.region_id}): ${n.name}`);
}

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:verify");

db.close();
