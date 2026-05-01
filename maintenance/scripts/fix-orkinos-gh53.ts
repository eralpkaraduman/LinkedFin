/**
 * Fix nm_0349 (Orkinos) etymology and add Ton balığı + Modern Greek όρκινος
 *
 * GitHub Issue #53: https://github.com/eralpkaraduman/LinkedFin/issues/53
 *
 * Problem:
 * - nm_0349 Orkinos etymology incorrectly traces it to θύννος (thýnnos)
 *   via "Byzantine Greek" with the same θύνω (to rush) root as Ton balığı.
 * - Authoritative Turkish etymology sources (Nişanyan Sözlük,
 *   etimolojiturkce.com) trace orkinos to a *different* Greek word:
 *   Modern Greek όρκινος ← Latin orca, cognate with Ancient Greek ὄρυξ.
 * - The existing relation `Orkinos borrowed_from Τόνος (nm_0324)` conflates
 *   two unrelated etymological chains.
 * - "Ton balığı" is a separate Turkish name for the same fish, missing from
 *   the database. Tr Wikipedia confirms orkinos = ton balığı (synonym).
 *
 * Solution:
 * 1. Update nm_0349 Orkinos etymology to the correct órkinos ← orca chain
 * 2. Add Modern Greek "όρκινος" as a new name under sp_077 (anchors the
 *    borrowing chain)
 * 3. Add Turkish "Ton balığı" as a new name under sp_077, with the
 *    independent thunnus etymology chain
 * 4. Delete the bogus borrowed_from relation between Orkinos and Τόνος
 * 5. Add correct relations:
 *    - Orkinos borrowed_from όρκινος (Modern Greek)
 *    - Ton balığı borrowed_from θύννος (Ancient Greek)
 *    - Orkinos alternate_of Ton balığı (same Turkish region)
 *    - Τόνος alternate_of όρκινος (both Modern Greek tuna words)
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Fixing nm_0349 Orkinos etymology (gh #53) ===\n");

// 1. Update nm_0349 Orkinos etymology
const newOrkinosEtymology =
	"From Modern Greek όρκινος (órkinos, tuna)\n" +
	"↳ From Latin orca, cognate with Ancient Greek ὄρυξ (óryks, pointed tool / mythical sea creature)\n" +
	"First attested in Turkish 1876 in Lugat-ı Osmani (Ahmet Vefik Paşa). Distinct chain from Ton balığı (thýnnos via Latin thunnus).";

db.run(
	`UPDATE names SET etymology = ? WHERE id = 'nm_0349'`,
	[newOrkinosEtymology],
);
console.log("Updated nm_0349 Orkinos etymology");

// Helper to get next nm_XXXX ID
function nextNameId(): string {
	const row = db
		.query(
			"SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) AS next_id FROM names",
		)
		.get() as { next_id: string };
	return row.next_id;
}

// 2. Add Modern Greek όρκινος
const orkinosGrkId = nextNameId();
db.run(
	`INSERT INTO names (
		id, name, species_id, region_id, lang,
		etymology, transliteration, phonetic
	) VALUES (?, ?, 'sp_077', 'greek', 'ell', ?, 'orkinos', '/ˈorcinos/')`,
	[
		orkinosGrkId,
		"όρκινος",
		"From Latin orca\n↳ Cognate with Ancient Greek ὄρυξ (óryks, pointed tool / mythical sea creature)\nModern Greek name for tuna, parallel to Τόνος (from Latin thunnus). Source of Turkish orkinos.",
	],
);
console.log(`Added Modern Greek όρκινος as ${orkinosGrkId}`);

// 3. Add Turkish Ton balığı
const tonBaligiId = nextNameId();
db.run(
	`INSERT INTO names (
		id, name, species_id, region_id, lang,
		etymology, transliteration, phonetic
	) VALUES (?, ?, 'sp_077', 'turkish-aegean', 'tur', ?, ?, ?)`,
	[
		tonBaligiId,
		"Ton balığı",
		"Compound: ton + balık\nton: from French thon (tuna)\n↳ From Latin thunnus\n↳ From Ancient Greek θύννος (thýnnos, tuna)\nbalık: fish\nSynonym of Orkinos in Turkish but with a separate borrowing chain (Latin/French route vs. Greek órkinos).",
		"Ton baligi",
		"/ˈton baɫɯɣɯ/",
	],
);
console.log(`Added Turkish Ton balığı as ${tonBaligiId}`);

// 4. Delete bogus relation Orkinos↔Τόνος
const deleted = db.run(
	`DELETE FROM name_relations
	 WHERE (source_id = 'nm_0349' AND target_id = 'nm_0324' AND relation = 'borrowed_from')`,
);
console.log(`Deleted bogus Orkinos→Τόνος borrowed_from relation (changes: ${deleted.changes})`);

// 5. Add correct relations
const relations: Array<[string, string, string, string]> = [
	[
		"nm_0349",
		orkinosGrkId,
		"borrowed_from",
		"orkinos ← Modern Greek όρκινος (per Nişanyan Sözlük, etimolojiturkce.com)",
	],
	[
		tonBaligiId,
		"nm_0368",
		"borrowed_from",
		"ton ← French thon ← Latin thunnus ← Ancient Greek θύννος",
	],
	[
		"nm_0349",
		tonBaligiId,
		"alternate_of",
		"Same fish (Thunnus genus); Tr Wikipedia: 'Orkinos, Ton balığı olarak da bilinir'",
	],
	[
		"nm_0324",
		orkinosGrkId,
		"alternate_of",
		"Both Modern Greek words for tuna: Τόνος (Latin/thunnus chain) and όρκινος (Latin/orca chain)",
	],
];

for (const [source, target, relation, notes] of relations) {
	db.run(
		`INSERT INTO name_relations (source_id, target_id, relation, notes)
		 VALUES (?, ?, ?, ?)`,
		[source, target, relation, notes],
	);
	console.log(`Added: ${source} ${relation} ${target}`);
}

console.log("\n=== Done ===");
db.close();
