/**
 * Fix nm_0420 (Rapu) etymology and sp_025 (Astacus astacus) species notes
 *
 * GitHub Issue #52: https://github.com/eralpkaraduman/LinkedFin/issues/52
 *
 * Problem 1: sp_025 species notes are Turkish-centric ("Found in Turkish
 * lakes... Documented in Turkish texts since 1360") which is irrelevant to
 * the Finnish name and violates the AGENTS.md rule "Species notes describe
 * the species itself, not language-specific names."
 *
 * Problem 2: nm_0420 Rapu etymology incorrectly traces it to "Proto-Finnic
 * *rapu". Wiktionary and Proto-Germanic etymology confirm rapu is a
 * Germanic loanword: borrowed from Old/Middle Swedish krabba via the older
 * Finnish form krapu, ultimately from Proto-Germanic *krabbô (PIE *grobʰ-).
 * Cognates: Estonian krabi, Ingrian/Votic krapu. The initial kr- cluster
 * was reduced to r- in modern Finnish.
 *
 * Solution:
 * 1. Update sp_025 notes with accurate Astacus astacus description
 * 2. Update nm_0420 etymology with correct Germanic loan chain
 *
 * Note: a `borrowed_from` link to Swedish Krabba (nm_0457) would be
 * etymologically accurate but is blocked by the same-species constraint
 * (Krabba is sp_024 / crab). The borrowing chain is captured in the
 * etymology text instead.
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Fixing nm_0420 Rapu and sp_025 (gh #52) ===\n");

// 1. Update sp_025 species notes — describe Astacus astacus accurately
const newSpeciesNotes =
	"Most common European crayfish (also called noble crayfish). Native to fresh waters from France through Central Europe to the Balkans, with northern populations in Scandinavia, Finland, and Eastern Europe. Restricted to unpolluted streams, rivers, and lakes; prefers sandy substrates. Keystone species in its ecosystems. Listed as vulnerable (IUCN) — populations reduced to ~5% by crayfish plague carried by invasive North American signal crayfish.";

db.run(`UPDATE species SET notes = ? WHERE id = 'sp_025'`, [newSpeciesNotes]);
console.log("Updated sp_025 species notes (removed Turkish-specific text)");

// 2. Update nm_0420 Rapu etymology
const newRapuEtymology =
	"Borrowed from Swedish krabba via the earlier Finnish form krapu\n" +
	"↳ From Old Norse krabbi\n" +
	"↳ From Proto-Germanic *krabbô\n" +
	"↳ From Proto-Indo-European *grobʰ- (to crawl, scratch)\n" +
	"Cognate with Estonian krabi, Ingrian/Votic krapu. The initial kr- cluster was reduced to r- in modern Finnish; the older form krapu is now archaic.";

db.run(`UPDATE names SET etymology = ? WHERE id = 'nm_0420'`, [
	newRapuEtymology,
]);
console.log("Updated nm_0420 Rapu etymology (Proto-Finnic → correct Germanic loan chain)");


console.log("\n=== Done ===");
db.close();
