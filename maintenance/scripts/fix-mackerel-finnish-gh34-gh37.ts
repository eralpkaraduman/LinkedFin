/**
 * Add Finnish mackerel names and explain French etymology
 *
 * GitHub Issue #34: https://github.com/eralpkaraduman/LinkedFin/issues/34
 * GitHub Issue #37: https://github.com/eralpkaraduman/LinkedFin/issues/37
 *
 * Problem:
 * - nm_0228 "Atlantic chub mackerel" etymology says "from Old French maquerel"
 *   but does not explain what the French word means
 * - No Finnish name for sp_056 (Scomber colias)
 * - No Finnish name for sp_081 (Scomber scombrus)
 *
 * Solution:
 * 1. Expand nm_0228 etymology to explain Old French maquerel
 * 2. Add Finnish name "Makrilli" for sp_056 (Scomber colias)
 * 3. Add Finnish name "Makrilli" for sp_081 (Scomber scombrus)
 */
import Database from "better-sqlite3";

const db = new Database("public/fish.db");

console.log("=== Fixing mackerel names (Issues #34, #37) ===\n");

// Show current state
const currentNm0228 = db
	.prepare("SELECT id, name, etymology FROM names WHERE id = 'nm_0228'")
	.get() as { id: string; name: string; etymology: string };
console.log("Current nm_0228 etymology:", currentNm0228.etymology);

// 1. Expand nm_0228 etymology to explain Old French maquerel
const newEtymology = `Compound: Atlantic + chub + mackerel
Atlantic: ocean range, chub: stouter body, mackerel: from Old French maquerel (mackerel)
↳ Possibly from Latin macula (spot, mark), referring to the fish's spotted markings`;

db.prepare("UPDATE names SET etymology = ? WHERE id = 'nm_0228'").run(newEtymology);
console.log("\nUpdated nm_0228 etymology");

// Also update nm_0451 (Atlantic mackerel for sp_081) for consistency
const currentNm0451 = db
	.prepare("SELECT id, name, etymology FROM names WHERE id = 'nm_0451'")
	.get() as { id: string; name: string; etymology: string };
console.log("\nCurrent nm_0451 etymology:", currentNm0451.etymology);

const newEtymology0451 = `Compound: Atlantic + mackerel
Atlantic: ocean range, mackerel: from Old French maquerel (mackerel)
↳ Possibly from Latin macula (spot, mark), referring to the fish's spotted markings`;

db.prepare("UPDATE names SET etymology = ? WHERE id = 'nm_0451'").run(newEtymology0451);
console.log("Updated nm_0451 etymology");

// 2. Get next available name IDs
const getNextId = () => {
	const result = db
		.prepare(
			"SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) as next_id FROM names",
		)
		.get() as { next_id: string };
	return result.next_id;
};

// 3. Add Finnish name "Makrilli" for sp_056 (Scomber colias)
const finnishColias = getNextId();
db.prepare(
	`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic)
	 VALUES (?, ?, 'sp_056', 'finland', 'fin', ?, ?, ?)`,
).run(
	finnishColias,
	"Makrilli",
	"From Swedish makrill (mackerel)\n↳ From Old French maquerel (mackerel)\n↳ Possibly from Latin macula (spot, mark)",
	"Makrilli",
	"/ˈmɑkrilːi/",
);
console.log(`\nAdded Finnish name '${finnishColias}': Makrilli for sp_056 (Scomber colias)`);

// 4. Add Finnish name "Makrilli" for sp_081 (Scomber scombrus)
const finnishScombrus = getNextId();
db.prepare(
	`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic)
	 VALUES (?, ?, 'sp_081', 'finland', 'fin', ?, ?, ?)`,
).run(
	finnishScombrus,
	"Makrilli",
	"From Swedish makrill (mackerel)\n↳ From Old French maquerel (mackerel)\n↳ Possibly from Latin macula (spot, mark)",
	"Makrilli",
	"/ˈmɑkrilːi/",
);
console.log(`Added Finnish name '${finnishScombrus}': Makrilli for sp_081 (Scomber scombrus)`);

// Verify
console.log("\n=== Verification ===");

const updatedNm0228 = db
	.prepare("SELECT id, name, etymology FROM names WHERE id = 'nm_0228'")
	.get() as { id: string; name: string; etymology: string };
console.log("\nnm_0228 etymology:", updatedNm0228.etymology);

const sp056Names = db
	.prepare("SELECT id, name, lang, etymology FROM names WHERE species_id = 'sp_056'")
	.all() as { id: string; name: string; lang: string; etymology: string }[];
console.log("\nsp_056 (Scomber colias) names:");
for (const n of sp056Names) {
	console.log(`  ${n.id} (${n.lang}): ${n.name}`);
}

const sp081Names = db
	.prepare("SELECT id, name, lang, etymology FROM names WHERE species_id = 'sp_081'")
	.all() as { id: string; name: string; lang: string; etymology: string }[];
console.log("\nsp_081 (Scomber scombrus) names:");
for (const n of sp081Names) {
	console.log(`  ${n.id} (${n.lang}): ${n.name}`);
}

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:verify");

db.close();
