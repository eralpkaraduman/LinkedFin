/**
 * Scope nm_0476 "Turkish salmon" to the Turkish Black Sea
 *
 * GitHub Issue #59: https://github.com/eralpkaraduman/LinkedFin/issues/59
 *
 * Problem:
 * - nm_0476 (Turkish salmon, sp_049 Oncorhynchus mykiss) was filed under
 *   region_id 'international'. The term is specific to Türkiye, not a global name.
 *
 * Research:
 * - "Türk somonu" is rainbow trout hatched inland, then grown out in sea cages
 *   off the Black Sea coast (Ordu, Trabzon, Giresun, Rize, Samsun, Sinop, Artvin).
 *   The trade body behind the brand is the Eastern Black Sea Exporters' Association
 *   (DKİB), and the industry site is literally "Turkish Salmon from Black Sea"
 *   (turkishsalmon.org), run out of Trabzon with SUMAE.
 * - The Aegean was checked explicitly: Muğla/İzmir/Aydın dominate Turkish marine
 *   aquaculture, but for sea bass and sea bream, not trout. Aegean summer sea
 *   temperatures are limiting for Oncorhynchus mykiss, so sea-cage trout there is
 *   marginal at best, and no "Turkish salmon" industry exists on that coast.
 *   Aegean trout production is inland (ponds, reservoirs), not sea-farmed.
 *
 * Solution:
 * - region_id: 'international' -> 'turkish-blacksea'
 * - etymology: name the actual production coast and explain "salmon"
 */
import Database from "better-sqlite3";

const db = new Database("public/fish.db");

console.log("=== Scoping nm_0476 Turkish salmon to the Black Sea (Issue #59) ===\n");

const current = db
	.prepare("SELECT id, name, lang, region_id, etymology FROM names WHERE id = 'nm_0476'")
	.get() as { id: string; name: string; lang: string; region_id: string; etymology: string };

console.log("Current:");
console.log(`  ${current.id} (${current.lang}): ${current.name}`);
console.log(`  Region: ${current.region_id}`);
console.log(`  Etymology: ${current.etymology}`);

const newEtymology =
	"Marketing term for rainbow trout sea-farmed off Türkiye's Black Sea coast\n" +
	"salmon: from Old French saumon\n" +
	"↳ From Latin salmō (salmon)";

db.prepare("UPDATE names SET region_id = 'turkish-blacksea', etymology = ? WHERE id = 'nm_0476'").run(
	newEtymology,
);

console.log("\nUpdated nm_0476");

console.log("\n=== Verification ===");
const updated = db
	.prepare("SELECT id, name, lang, region_id, etymology FROM names WHERE id = 'nm_0476'")
	.get() as { id: string; name: string; lang: string; region_id: string; etymology: string };
console.log(`\n${updated.id} (${updated.lang}): ${updated.name}`);
console.log(`  Region: ${updated.region_id}`);
console.log(`  Etymology: ${updated.etymology}`);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:validate");

db.close();
