/**
 * Record that Turkish kerevit and karavide are the same Greek word.
 *
 * nm_0114 (Kerevit, sp_025 Astacus astacus) and nm_0564 (karavide, sp_110
 * Nephrops norvegicus) both descend from Modern Greek καραβίδα karavída, but
 * neither record mentioned the other, so a reader on one could not discover
 * the other existed. They sit on different species, so name_relations cannot
 * express the link — the same-species constraint again — and it goes in prose.
 *
 * Both etymologies also stopped at κάραβος and skipped the diminutive that
 * actually produces the -ιδ- of καραβίδα.
 *
 * Sources:
 * - https://en.wiktionary.org/wiki/kerevit — "inherited from Ottoman Turkish
 *   كروت (kerevit, 'crayfish'), from Greek καραβίδα (karavída)"; lists
 *   karavide and kerevides as alternative forms.
 * - https://www.etimolojiturkce.com/kelime/kerevit/ — marks the source Yun.
 *   (Yunanca, Greek); Modern Greek karavída < Ancient Greek kārabís, karabid-,
 *   diminutive of kārabos; first attested as kerevid in the Danişmend-Name (1360).
 * - https://tr.wiktionary.org/wiki/karavide — defines karavide as kerevit, from
 *   Pontus Rumcası (Pontic Greek).
 *
 * NOT asserted: the "Romanian origin" found on several Turkish word sites. That
 * is a misreading of the abbreviation Rum. (Rumca, Greek) as Rumence
 * (Romanian); every source consulted says Greek.
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

const KEREVIT = `From Greek καραβίδα karavída (crayfish, small lobster)
↳ From Ancient Greek καραβίς karabís (crayfish), a diminutive of κάραβος kárabos (lobster, horned beetle)
Attested as kerevid in the Danişmend-Name (1360). Turkish karavide is the same Greek word taken again via Pontic Greek; the two settled on different animals, kerevit on the freshwater crayfish and karavide on the Norway lobster.`;

const KARAVIDE = `From Greek καραβίδα karavída (crayfish, small lobster)
↳ From Ancient Greek καραβίς karabís (crayfish), a diminutive of κάραβος kárabos (lobster, horned beetle)
Taken via Pontic Greek and a doublet of kerevit, the same Greek word; the two settled on different animals, karavide on the Norway lobster and kerevit on the freshwater crayfish.`;

const updates: Array<[string, string, string]> = [
	["nm_0114", "Kerevit", KEREVIT],
	["nm_0564", "karavide", KARAVIDE],
];

db.run("BEGIN");
try {
	for (const [id, label, etymology] of updates) {
		const changed = db.run(
			`UPDATE names SET etymology = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?`,
			[etymology, id],
		);
		if (changed.changes !== 1) {
			throw new Error(`${id} matched ${changed.changes} rows, expected 1`);
		}
		console.log(`  ✓ ${id}  ${label}`);
	}
	db.run("COMMIT");
	console.log("\n✓ committed");
} catch (error) {
	db.run("ROLLBACK");
	console.error("\n✗ rolled back:", error);
	process.exit(1);
}
