/**
 * Register ὀκτάπους as Ancient Greek name for sp_021 and link to Χταπόδι
 *
 * GitHub Issue #50: https://github.com/eralpkaraduman/LinkedFin/issues/50
 *
 * Issue: nm_0097 Χταπόδι etymology refers to ὀκτώπους but that word is
 * not registered as a name for the species. Register it.
 *
 * Research findings (Wiktionary):
 * - The canonical Ancient Greek form is ὀκτάπους (oktápous, "eight-footed").
 *   ὀκτώπους is a variant form of the same compound (ὀκτώ "eight" + πούς
 *   "foot").
 * - Modern Greek χταπόδι descends specifically from Byzantine Greek
 *   ὀκταπόδιον (oktapódion), the diminutive of ὀκτάπους.
 * - πολύπους (polýpous, "many-footed") was the more common ancient term
 *   used by Aristotle and Pliny. Already in our DB as nm_0380.
 *
 * Solution:
 * 1. Add ὀκτάπους as a new Ancient Greek name under sp_021 (using the
 *    canonical α form, with ὀκτώπους variant noted in the etymology)
 * 2. Update nm_0097 Χταπόδι etymology to include the Byzantine
 *    ὀκταπόδιον (diminutive) intermediate
 * 3. Add borrowed_from relation Χταπόδι → ὀκτάπους
 * 4. Add alternate_of relation πολύπους ↔ ὀκτάπους (both Ancient Greek
 *    names for octopus, same species)
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Registering ὀκτάπους for sp_021 (gh #50) ===\n");

function nextNameId(): string {
	const row = db
		.query(
			"SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) AS next_id FROM names",
		)
		.get() as { next_id: string };
	return row.next_id;
}

// 1. Add ὀκτάπους as new Ancient Greek name for sp_021
const oktapousId = nextNameId();
db.run(
	`INSERT INTO names (
		id, name, species_id, region_id, lang,
		etymology, transliteration, phonetic
	) VALUES (?, ?, 'sp_021', 'ancient-greece', 'grc', ?, ?, ?)`,
	[
		oktapousId,
		"ὀκτάπους",
		"Compound: ὀκτώ + πούς\nὀκτώ (oktṓ): eight\nπούς (poús): foot\nLiterally 'eight-footed'. Variant form: ὀκτώπους (oktṓpous). Less common in classical texts than πολύπους but the ancestor of Modern Greek χταπόδι via the Byzantine diminutive ὀκταπόδιον.",
		"oktapous",
		"/oktápuːs/",
	],
);
console.log(`Added Ancient Greek ὀκτάπους as ${oktapousId}`);

// 2. Update nm_0097 Χταπόδι etymology — add Byzantine diminutive intermediate
const newChtapodiEtymology =
	"From Byzantine Greek ὀκταπόδιον (oktapódion, diminutive of ὀκτάπους)\n" +
	"↳ From Ancient Greek ὀκτάπους (oktápous, eight-footed)\n" +
	"↳ Variant form: ὀκτώπους (oktṓpous)\n" +
	"↳ Compound: ὀκτώ (oktṓ, eight) + πούς (poús, foot)\n" +
	"The diminutive ὀκταπόδιον evolved phonetically into modern χταπόδι (initial vowel lost, -ιον suffix reduced).";

db.run(`UPDATE names SET etymology = ? WHERE id = 'nm_0097'`, [
	newChtapodiEtymology,
]);
console.log("Updated nm_0097 Χταπόδι etymology with Byzantine intermediate");

// 3. Add borrowed_from relation: Χταπόδι → ὀκτάπους
db.run(
	`INSERT INTO name_relations (source_id, target_id, relation, notes)
	 VALUES ('nm_0097', ?, 'borrowed_from', ?)`,
	[
		oktapousId,
		"Modern Greek χταπόδι ← Byzantine ὀκταπόδιον (diminutive of ὀκτάπους)",
	],
);
console.log("Added: nm_0097 (Χταπόδι) borrowed_from " + oktapousId + " (ὀκτάπους)");

// 4. Add alternate_of relation: πολύπους (nm_0380) ↔ ὀκτάπους
db.run(
	`INSERT INTO name_relations (source_id, target_id, relation, notes)
	 VALUES ('nm_0380', ?, 'alternate_of', ?)`,
	[
		oktapousId,
		"Both Ancient Greek names for the octopus: πολύπους ('many-footed', the classical preferred term used by Aristotle and Pliny) and ὀκτάπους ('eight-footed', the ancestor of Modern Greek χταπόδι).",
	],
);
console.log(
	"Added: nm_0380 (πολύπους) alternate_of " + oktapousId + " (ὀκτάπους)",
);

console.log("\n=== Done ===");
db.close();
