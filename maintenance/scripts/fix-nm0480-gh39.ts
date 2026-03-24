/**
 * Explain Greek μύραινα meaning in nm_0480 etymology
 *
 * GitHub Issue #39: https://github.com/eralpkaraduman/LinkedFin/issues/39
 *
 * Problem:
 * - Etymology for nm_0480 (Müren balığı) says "From Ancient Greek μύραινα mýraina (moray eel)"
 *   but doesn't explain the meaning of the Greek word itself
 *
 * Solution:
 * - Expand the Greek etymology to explain that μύραινα means "the slimy one",
 *   likely from μύρον mýron (unguent, oil), referring to the eel's mucus-coated skin
 */
import Database from "better-sqlite3";

const db = new Database("fish.db");

console.log("=== Fixing nm_0480 Müren balığı etymology (Issue #39) ===\n");

// Show current state
const current = db
	.prepare("SELECT id, name, lang, etymology FROM names WHERE id = 'nm_0480'")
	.get() as { id: string; name: string; lang: string; etymology: string };
console.log("Current:");
console.log(`  ${current.id} (${current.lang}): ${current.name}`);
console.log(`  Etymology: ${current.etymology}`);

// Update etymology with Greek word meaning explained
const newEtymology =
	"From Latin mūraena (moray eel)\n" +
	"↳ From Ancient Greek μύραινα mýraina (the slimy one, a type of eel)\n" +
	"↳ Related to μύρον mýron (unguent, oil), referring to the eel's mucus-coated skin";

db.prepare("UPDATE names SET etymology = ? WHERE id = 'nm_0480'").run(newEtymology);
console.log("\nUpdated nm_0480 etymology");

// Verify
console.log("\n=== Verification ===");
const updated = db
	.prepare("SELECT id, name, lang, etymology FROM names WHERE id = 'nm_0480'")
	.get() as { id: string; name: string; lang: string; etymology: string };
console.log(`\n${updated.id} (${updated.lang}): ${updated.name}`);
console.log(`  Etymology: ${updated.etymology}`);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy");

db.close();
