/**
 * Research and update nm_0171 (Baltic herring) etymology
 *
 * GitHub Issue #38: https://github.com/eralpkaraduman/LinkedFin/issues/38
 *
 * Problem:
 * - Etymology for nm_0171 is "Compound: Baltic + herring / Baltic: Baltic Sea, herring: fish type"
 *   which merely labels the components without explaining their origins
 *
 * Solution:
 * - Replace with a proper etymology tracing word origins:
 *   "Baltic" ← Latin Balticus (the Baltic Sea) ← possibly from Proto-Indo-European *bʰel- (white, shining)
 *   "herring" ← Old English hǣring ← Proto-Germanic *hēringaz (possibly "silvery fish")
 */
import Database from "better-sqlite3";

const db = new Database("public/fish.db");

console.log("=== Fixing nm_0171 Baltic herring etymology (Issue #38) ===\n");

// Show current state
const current = db
	.prepare("SELECT id, name, lang, etymology FROM names WHERE id = 'nm_0171'")
	.get() as { id: string; name: string; lang: string; etymology: string };
console.log("Current:");
console.log(`  ${current.id} (${current.lang}): ${current.name}`);
console.log(`  Etymology: ${current.etymology}`);

// Update etymology
const newEtymology =
	"Compound: Baltic + herring\n" +
	"Baltic: From Latin Balticus (the Baltic Sea)\n" +
	"↳ Possibly from Proto-Indo-European *bʰel- (white, shining), or from Lithuanian baltas (white)\n" +
	"herring: From Old English hǣring\n" +
	"↳ From Proto-Germanic *hēringaz, possibly related to hǣr (gray, silvery), describing the fish's appearance";

db.prepare("UPDATE names SET etymology = ? WHERE id = 'nm_0171'").run(newEtymology);
console.log("\nUpdated nm_0171 etymology");

// Verify
console.log("\n=== Verification ===");
const updated = db
	.prepare("SELECT id, name, lang, etymology FROM names WHERE id = 'nm_0171'")
	.get() as { id: string; name: string; lang: string; etymology: string };
console.log(`\n${updated.id} (${updated.lang}): ${updated.name}`);
console.log(`  Etymology: ${updated.etymology}`);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy");

db.close();
