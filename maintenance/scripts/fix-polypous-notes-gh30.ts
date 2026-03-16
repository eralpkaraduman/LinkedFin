/**
 * Fix nm_0380 (πολύπους) species notes showing unrelated Turkish context
 *
 * GitHub Issue #30: https://github.com/eralpkaraduman/LinkedFin/issues/30
 *
 * Problem:
 * - sp_021 (Octopus vulgaris) species notes say: "First recorded in Turkish
 *   in Evliya Çelebi's Seyahatname (1665). Greek-origin name."
 * - This Turkish context shows on ALL names for the species, including
 *   the Ancient Greek πολύπους (nm_0380), where it makes no sense.
 *
 * Solution:
 * 1. Move the Turkish historical note to nm_0096 (Ahtapot) name notes
 * 2. Replace sp_021 species notes with species-level description
 */
import { Database } from "bun:sqlite";

const db = new Database("fish.db");

console.log("=== Fixing sp_021 species notes (Issue #30) ===\n");

// Show current state
const currentSpecies = db
	.query("SELECT * FROM species WHERE id = 'sp_021'")
	.get() as {
	id: string;
	scientific_name: string;
	notes: string;
};
console.log("Current sp_021 notes:", currentSpecies.notes);

const currentAhtapot = db
	.query("SELECT id, name, notes FROM names WHERE id = 'nm_0096'")
	.get() as {
	id: string;
	name: string;
	notes: string | null;
};
console.log("Current nm_0096 (Ahtapot) notes:", currentAhtapot.notes);

// 1. Move Turkish historical note to nm_0096 (Ahtapot)
db.run(`UPDATE names SET notes = ? WHERE id = 'nm_0096'`, [
	"First recorded in Turkish in Evliya Çelebi's Seyahatname (1665). Greek-origin name.",
]);
console.log("\nMoved Turkish note to nm_0096 (Ahtapot)");

// 2. Update sp_021 species notes with species-level info
db.run(`UPDATE species SET notes = ? WHERE id = 'sp_021'`, [
	"Most intelligent invertebrate. Found throughout Mediterranean and Eastern Atlantic. Known for camouflage ability and problem-solving.",
]);
console.log("Updated sp_021 species notes");

// Verify
console.log("\n=== Verification ===");
const updatedSpecies = db
	.query("SELECT notes FROM species WHERE id = 'sp_021'")
	.get() as { notes: string };
console.log("sp_021 notes:", updatedSpecies.notes);

const updatedAhtapot = db
	.query("SELECT notes FROM names WHERE id = 'nm_0096'")
	.get() as { notes: string };
console.log("nm_0096 notes:", updatedAhtapot.notes);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:verify");

db.close();
