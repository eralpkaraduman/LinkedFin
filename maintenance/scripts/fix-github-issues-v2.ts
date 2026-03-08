/**
 * Fix incorrect data from first attempt:
 * 1. Remove Tombik from sp_014 (wrong species - Tombik is Auxis thazard, not Sarda sarda)
 * 2. Fix Atlantic salmon note (Turkey farms rainbow trout, not Atlantic salmon)
 * 3. Add correct Tombik species and name
 */
import { Database } from "bun:sqlite";

const db = new Database("fish.db");

console.log("=== Fixing incorrect data ===\n");

// 1. Remove incorrect Tombik record (nm_0459) and its relations
console.log("1. Removing incorrect Tombik (nm_0459) from Sarda sarda...");
db.run("DELETE FROM name_relations WHERE source_id = 'nm_0459' OR target_id = 'nm_0459'");
db.run("DELETE FROM names WHERE id = 'nm_0459'");
console.log("   ✓ Removed nm_0459 and its relations");

// 2. Restore Sivri's original note
console.log("\n2. Restoring Sivri's original note...");
db.run(`UPDATE names SET notes = 'Pointed snout variant name' WHERE id = 'nm_0252'`);
console.log("   ✓ Restored Sivri note");

// 3. Fix Atlantic salmon species note
console.log("\n3. Fixing Atlantic salmon species note...");
db.run(`UPDATE species SET notes = 'Not commercially farmed in Turkey. "Turkish salmon" marketed in Turkey is actually sea-grown rainbow trout (Oncorhynchus mykiss), not Atlantic salmon.' WHERE id = 'sp_015'`);
console.log("   ✓ Fixed Atlantic salmon note");

// 4. Check if Auxis species exists, if not create it
console.log("\n4. Adding Tombik with correct species (Auxis thazard)...");
const auxisExists = db.query("SELECT id FROM species WHERE scientific_name LIKE 'Auxis%'").get();

let auxisSpeciesId: string;
if (!auxisExists) {
	// Get next species ID
	const maxSpeciesResult = db.query("SELECT MAX(id) as max FROM species").get() as { max: string };
	const nextSpeciesNum = Number.parseInt(maxSpeciesResult.max.replace("sp_", ""), 10) + 1;
	auxisSpeciesId = `sp_${String(nextSpeciesNum).padStart(3, "0")}`;

	db.run(`
		INSERT INTO species (id, scientific_name, family, habitat, notes)
		VALUES (?, 'Auxis thazard', 'Scombridae', 'marine', 'Frigate tuna/frigate mackerel. Often confused with bonito (Sarda sarda) at Turkish fish markets. Has spots (not lines), no teeth, darker meat.')
	`, [auxisSpeciesId]);
	console.log(`   ✓ Created species: Auxis thazard (${auxisSpeciesId})`);
} else {
	auxisSpeciesId = (auxisExists as { id: string }).id;
	console.log(`   → Species already exists: ${auxisSpeciesId}`);
}

// 5. Add Tombik name for Auxis thazard
const maxIdResult = db.query("SELECT MAX(id) as max FROM names").get() as { max: string };
const nextIdNum = Number.parseInt(maxIdResult.max.replace("nm_", ""), 10) + 1;
const tombikId = `nm_${String(nextIdNum).padStart(4, "0")}`;

db.run(`
	INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
	VALUES (?, 'Tombik', ?, 'turkish-aegean', 'tur', 'From Turkish tombik (chubby, plump) - describing its rounded body shape', 'Tombik', '/tombik/', 'Frigate tuna. Often sold as palamut at fish markets. Distinguished by spots (vs lines on palamut), no teeth, and darker meat.')
`, [tombikId, auxisSpeciesId]);
console.log(`   ✓ Added: Tombik (${tombikId}) for ${auxisSpeciesId}`);

// 6. Add confused_with relation between Sivri (bonito) and Tombik (frigate tuna)
// This is a cross-species confusion which is the correct representation
db.run(`
	INSERT OR IGNORE INTO name_relations (source_id, target_id, relation, notes)
	VALUES (?, ?, 'confused_with', 'Different species often confused at fish markets - Tombik (frigate tuna) sold as Sivri/palamut (bonito)')
`, ["nm_0252", tombikId]);
console.log("   ✓ Added cross-species confused_with relation: Sivri ↔ Tombik");

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:validate");

db.close();
