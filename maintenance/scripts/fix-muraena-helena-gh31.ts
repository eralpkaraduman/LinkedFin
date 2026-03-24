/**
 * Expand sp_072 (Muraena helena) etymology and add Turkish name
 *
 * GitHub Issue #31: https://github.com/eralpkaraduman/LinkedFin/issues/31
 *
 * Problem:
 * - Etymology for existing names is incomplete
 * - No Turkish name for this species
 *
 * Solution:
 * 1. Expand etymology for nm_0319 (Σμέρνα) and nm_0335 (Mediterranean moray)
 * 2. Add Turkish name "Müren balığı" (nm_0480)
 * 3. Update species notes with richer description
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Fixing sp_072 Muraena helena (Issue #31) ===\n");

// Show current state
const currentNames = db
	.query(
		"SELECT id, name, lang, etymology, notes FROM names WHERE species_id = 'sp_072'",
	)
	.all() as { id: string; name: string; lang: string; etymology: string; notes: string | null }[];
console.log("Current names for sp_072:");
for (const n of currentNames) {
	console.log(`  ${n.id} (${n.lang}): ${n.name}`);
	console.log(`    Etymology: ${n.etymology}`);
	console.log(`    Notes: ${n.notes}`);
}

// 1. Expand nm_0319 (Σμέρνα) etymology
db.run(`UPDATE names SET etymology = ? WHERE id = 'nm_0319'`, [
	"From Ancient Greek σμύραινα smýraina (moray eel)\n↳ Alternative form of μύραινα mýraina",
]);
console.log("\nUpdated nm_0319 (Σμέρνα) etymology");

// 2. Expand nm_0335 (Mediterranean moray) etymology
db.run(`UPDATE names SET etymology = ? WHERE id = 'nm_0335'`, [
	"From Latin mūraena (moray eel)\n↳ From Ancient Greek μύραινα mýraina (moray eel)",
]);
console.log("Updated nm_0335 (Mediterranean moray) etymology");

// 3. Expand nm_0388 (μύραινα) etymology
db.run(`UPDATE names SET etymology = ? WHERE id = 'nm_0388'`, [
	"From Ancient Greek μύραινα mýraina (moray eel)\n↳ Possibly pre-Greek substrate origin (Beekes)",
]);
console.log("Updated nm_0388 (μύραινα) etymology");

// 4. Add Turkish name "Müren balığı"
const nextIdResult = db
	.query(
		"SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) as next_id FROM names",
	)
	.get() as { next_id: string };
const turkishNameId = nextIdResult.next_id;

db.run(
	`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
	 VALUES (?, ?, 'sp_072', 'turkish-aegean', 'tur', ?, ?, ?, ?)`,
	[
		turkishNameId,
		"Müren balığı",
		"From Latin mūraena (moray eel)\n↳ From Ancient Greek μύραινα mýraina (moray eel)",
		"Müren balığı",
		"/myˈɾen bɑˈɫɯ.ɰɯ/",
		"Literally moray fish. Found along Turkish Mediterranean and Aegean coasts.",
	],
);
console.log(`\nAdded Turkish name '${turkishNameId}': Müren balığı`);

// 5. Update species notes
db.run(`UPDATE species SET notes = ? WHERE id = 'sp_072'`, [
	"Mediterranean moray eel. Elongated, scaleless body up to 1.5m. Found in rocky crevices throughout the Mediterranean and Eastern Atlantic. Bite can be dangerous.",
]);
console.log("Updated sp_072 species notes");

// Verify
console.log("\n=== Verification ===");
const updatedNames = db
	.query(
		"SELECT id, name, lang, etymology, notes FROM names WHERE species_id = 'sp_072'",
	)
	.all() as { id: string; name: string; lang: string; etymology: string; notes: string | null }[];
for (const n of updatedNames) {
	console.log(`\n${n.id} (${n.lang}): ${n.name}`);
	console.log(`  Etymology: ${n.etymology}`);
	console.log(`  Notes: ${n.notes}`);
}

const updatedSpecies = db
	.query("SELECT notes FROM species WHERE id = 'sp_072'")
	.get() as { notes: string };
console.log("\nsp_072 notes:", updatedSpecies.notes);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:verify");

db.close();
