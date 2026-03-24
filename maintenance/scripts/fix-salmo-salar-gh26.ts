/**
 * Fix sp_015 (Atlantic salmon) species notes and add Turkish salmon relation
 *
 * GitHub Issue #26: https://github.com/eralpkaraduman/LinkedFin/issues/26
 *
 * Problem:
 * - The species notes contain a "confused with" explanation that should be a name relation
 * - Notes say: "Not commercially farmed in Turkey. 'Turkish salmon' marketed in Turkey
 *   is actually sea-grown rainbow trout (Oncorhynchus mykiss), not Atlantic salmon"
 *
 * Solution:
 * 1. Update sp_015 notes with actual Atlantic salmon species description
 * 2. Add "Turkish salmon" name pointing to rainbow trout (sp_049)
 * 3. Create confused_with relation from "Turkish salmon" to Atlantic salmon name
 * 4. Move the marketing note to the "Turkish salmon" name record
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Fixing sp_015 (Atlantic salmon) species notes ===\n");

// Show current state
const currentSpecies = db.query("SELECT * FROM species WHERE id = 'sp_015'").get() as {
	id: string;
	scientific_name: string;
	notes: string;
};
console.log("Current sp_015 notes:", currentSpecies.notes);

// 1. Update species notes with actual Atlantic salmon description
const newSpeciesNotes =
	"Anadromous - spawns in freshwater, migrates to Atlantic Ocean to mature. " +
	"Iteroparous - can survive spawning and return to sea to spawn again (unlike Pacific salmon). " +
	"Native to North Atlantic from North America to Europe. Silver-blue coloring with black spots above lateral line.";

db.run(`
	UPDATE species
	SET notes = ?
	WHERE id = 'sp_015'
`, [newSpeciesNotes]);

console.log("\nUpdated sp_015 notes:", newSpeciesNotes);

// 2. Get next available name ID
const nextIdResult = db.query(
	"SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) as next_id FROM names"
).get() as { next_id: string };
const turkishSalmonId = nextIdResult.next_id;

console.log("\nAdding 'Turkish salmon' name with ID:", turkishSalmonId);

// 3. Add "Turkish salmon" as a name pointing to rainbow trout (sp_049)
// This is a marketing/commercial name used in Turkey for sea-farmed rainbow trout
db.run(`
	INSERT INTO names (
		id, name, species_id, region_id, lang,
		etymology, transliteration, phonetic, notes
	) VALUES (
		?,
		'Turkish salmon',
		'sp_049',
		'international',
		'eng',
		'Marketing term for sea-farmed rainbow trout from Turkey',
		'Turkish salmon',
		'/ˈtɜːkɪʃ ˈsæmən/',
		'Not commercially farmed in Turkey. "Turkish salmon" marketed in Turkey is actually sea-grown rainbow trout (Oncorhynchus mykiss), not Atlantic salmon (Salmo salar). Turkey is the largest producer of rainbow trout.'
	)
`, [turkishSalmonId]);

console.log("Added 'Turkish salmon' name record");

// 4. Create confused_with relation from "Turkish salmon" to Atlantic salmon (nm_0072)
// nm_0072 is the English "Atlantic salmon" name for sp_015
db.run(`
	INSERT INTO name_relations (source_id, target_id, relation, notes)
	VALUES (?, 'nm_0072', 'confused_with', '"Turkish salmon" is marketing name for rainbow trout, often confused with Atlantic salmon')
`, [turkishSalmonId]);

console.log("Added confused_with relation: Turkish salmon <-> Atlantic salmon");

// Verify changes
console.log("\n=== Verification ===");

const updatedSpecies = db.query("SELECT notes FROM species WHERE id = 'sp_015'").get() as {
	notes: string;
};
console.log("\nsp_015 (Salmo salar) notes:", updatedSpecies.notes);

const turkishSalmon = db.query("SELECT * FROM names WHERE id = ?").get(turkishSalmonId) as {
	id: string;
	name: string;
	species_id: string;
	notes: string;
};
console.log("\nNew 'Turkish salmon' name:");
console.log("  ID:", turkishSalmon.id);
console.log("  Name:", turkishSalmon.name);
console.log("  Species:", turkishSalmon.species_id, "(rainbow trout)");
console.log("  Notes:", turkishSalmon.notes);

const relation = db.query(`
	SELECT n1.name as source, r.relation, n2.name as target, r.notes
	FROM name_relations r
	JOIN names n1 ON r.source_id = n1.id
	JOIN names n2 ON r.target_id = n2.id
	WHERE r.source_id = ?
`).get(turkishSalmonId) as { source: string; relation: string; target: string; notes: string };
console.log("\nRelation:", relation.source, "<->", relation.target);
console.log("  Type:", relation.relation);
console.log("  Notes:", relation.notes);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:verify");

db.close();
