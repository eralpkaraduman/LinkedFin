/**
 * Fix nm_0245 (Hamsi) and nm_0536 (Anchois) etymologies; clarify ançüez
 *
 * GitHub Issue #51: https://github.com/eralpkaraduman/LinkedFin/issues/51
 *
 * Question: "Is anchovy really hamsi in turkish? What is the name ançüez
 * refer to then in turkish?"
 *
 * Findings:
 * 1. Yes — hamsi IS the Turkish name for the European anchovy (Engraulis
 *    encrasicolus). But the existing etymology is wrong: it traces hamsi
 *    to Greek ἀφύη (aphýē). Wiktionary confirms hamsi actually comes from
 *    Greek χαμψί (champsí, possibly from a Black Sea substrate) via
 *    Ottoman Turkish خمسی. ἀφύη went a different route, into Romance
 *    languages (Italian acciuga, French anchois).
 *
 * 2. Ançüez is NOT a fish name — it's the salted/preserved anchovy paste
 *    or fillet (originally an Italian preparation). Tr Wikipedia treats
 *    ançüez as the food product: "ançüezin bir balık ismi olmayıp ortaya
 *    çıkan mezenin ismi olmasıdır" (ançüez is not a fish name but the
 *    name of the resulting paste). It IS a separate borrowing into
 *    Turkish — likely via French anchois — but the word refers to the
 *    paste, not the fish. We do not add ançüez as a name; we explain it
 *    in the Hamsi etymology so the distinction is captured.
 *
 * 3. Anchois etymology in the DB credits Spanish anchoa from Basque antzua
 *    as the primary path. Wiktionary's primary documented path is
 *    Ligurian/Romance: French anchois ← Old Occitan anchoia ← Ligurian
 *    anciôa ← Vulgar Latin *apiuva ← Latin aphyē ← Ancient Greek ἀφύη.
 *    The Basque theory exists but has phonetic problems and is debated.
 *    Update to the Ligurian primary, Basque as alternative.
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Fixing Hamsi & Anchois etymologies (gh #51) ===\n");

// 1. Update nm_0245 Hamsi
const newHamsiEtymology =
	"From Ottoman Turkish خمسی (hamsı)\n" +
	"↳ From Greek χαμψί (champsí, anchovy)\n" +
	"↳ Possibly from a Black Sea substrate (uncertain ultimate origin)\n" +
	'Distinct from the Romance/Italian "ançüez" (a salted-anchovy paste, not a fish name) which entered Turkish via French anchois (Italian acciuga). Both ultimately relate to anchovies but came through different borrowing chains: hamsi via Greek χαμψί, ançüez via the Romance ἀφύη lineage.';

db.run(`UPDATE names SET etymology = ? WHERE id = 'nm_0245'`, [
	newHamsiEtymology,
]);
console.log("Updated nm_0245 Hamsi etymology (ἀφύη → correct χαμψί source)");

// 2. Update nm_0536 Anchois
const newAnchoisEtymology =
	"Inherited from Old French, from Old Occitan anchoia\n" +
	"↳ From Ligurian anciôa\n" +
	"↳ From Vulgar Latin *apiuva\n" +
	"↳ From Latin aphyē (small fry)\n" +
	"↳ From Ancient Greek ἀφύη (aphýē, anchovy/small fish)\n" +
	"An older alternative theory derived anchois from Basque antxu/anchu (dried fish), but the phonetic evidence is irregular and the Ligurian/Romance path is the primary documented one (Wiktionary).";

db.run(`UPDATE names SET etymology = ? WHERE id = 'nm_0536'`, [
	newAnchoisEtymology,
]);
console.log(
	"Updated nm_0536 Anchois etymology (Spanish/Basque primary → Ligurian/Romance primary)",
);

console.log("\n=== Done ===");
db.close();
