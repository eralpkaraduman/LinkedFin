/**
 * Move nm_0484 "Gambero imperiale" from sp_020 to sp_022, and link it to
 * nm_0460 "Mazzancolla" as an alternate name.
 *
 * TREK-553. Found during the TREK-542 etymology audit, which flagged the
 * mismatch from the name's meaning but did not confirm the species.
 *
 * Problem:
 * - nm_0484 "Gambero imperiale" (Italian) sat on sp_020 Homarus gammarus,
 *   the European lobster. "Gambero" means prawn/shrimp, not lobster, and
 *   the Italian name for Homarus gammarus is "astice".
 *
 * Research (confirmed, not inferred):
 * - it.wikipedia.org "Penaeus kerathurus" (the article Melicertus kerathurus
 *   redirects to; the species has bounced between Penaeus and Melicertus and
 *   it.wiki now files it under Penaeus with Melicertus as the synonym — our
 *   sp_022 already records "Formerly Penaeus kerathurus" so both names refer
 *   to the same animal). It lists the Italian names as: Mazzancolla,
 *   Mazzancolla imperiale, Gambero imperiale, Mazzancolla mediterranea,
 *   Gamberone mediterraneo — plus the regional list, in which Sicily uses
 *   "Gambero imperiale" and "Gambero barbuto", and Lazio/Toscana/Marche use
 *   "Mazzancolla".
 * - hellofish.it, "Il gambero 'imperiale' dei mari italiani: la Mazzancolla" —
 *   trade/market source using "gambero imperiale" for exactly this species,
 *   the imperiale epithet coming from its size and dominance among the
 *   Mediterranean penaeids (>100 g, ~20 cm).
 * - Italian official commercial designations (DM 22 settembre 2017,
 *   denominazioni in lingua italiana delle specie ittiche): Homarus gammarus
 *   is "Astice" (FAO LBE). It is not, and cannot be, "gambero imperiale".
 *
 * Changes:
 * 1. nm_0484.species_id: sp_020 -> sp_022.
 *    Safe: the duplicate check keys on name|species_id|region_id and the name
 *    strings differ ("Gambero imperiale" vs "Mazzancolla"), so no collision
 *    with nm_0460, which is also region 'italy'.
 * 2. Etymology on nm_0484 is left alone on purpose. It reads
 *    "Compound: gambero + imperiale / gambero: prawn/shrimp, imperiale:
 *    imperial" — purely about the words, with no reference to lobsters or
 *    Homarus, and "prawn/shrimp" is now correct for the species it points at.
 * 3. Add alternate_of nm_0460 <-> nm_0484 (one row; the relation is
 *    documented as bidirectional). Both are Italian names for the same
 *    animal: "Mazzancolla" is the standard/official designation, "Gambero
 *    imperiale" the market and Sicilian regional name. Not a size class and
 *    not a different preparation, so alternate_of is the right type. Legal
 *    only after step 1, since the validator enforces same-species on
 *    alternate_of.
 */
import Database from "better-sqlite3"

const db = new Database("public/fish.db")

type NameRow = {
	id: string
	name: string
	species_id: string
	scientific_name: string
	region_id: string
	etymology: string
}

const nameQuery = db.prepare<[string], NameRow>(
	`SELECT n.id, n.name, n.species_id, s.scientific_name, n.region_id, n.etymology
	 FROM names n JOIN species s ON s.id = n.species_id
	 WHERE n.id = ?`,
)
const countQuery = db.prepare<[string], { c: number }>(
	"SELECT COUNT(*) AS c FROM names WHERE species_id = ?",
)
const relationQuery = db.prepare<[string, string], { source_id: string; target_id: string; relation: string; notes: string | null }>(
	`SELECT source_id, target_id, relation, notes FROM name_relations
	 WHERE source_id IN (?, ?) OR target_id IN (?, ?)`,
)

function report(label: string) {
	console.log(`--- ${label} ---`)
	for (const id of ["nm_0484", "nm_0460"]) {
		const row = nameQuery.get(id)
		if (!row) {
			console.log(`${id}: MISSING`)
			continue
		}
		console.log(`${row.id} "${row.name}" -> ${row.species_id} (${row.scientific_name}), region ${row.region_id}`)
	}
	for (const sp of ["sp_020", "sp_022"]) {
		console.log(`${sp}: ${countQuery.get(sp)?.c} names`)
	}
	const rels = relationQuery.all("nm_0484", "nm_0460", "nm_0484", "nm_0460")
	console.log(
		rels.length === 0
			? "relations touching nm_0484/nm_0460: none"
			: `relations touching nm_0484/nm_0460:\n${rels.map((r) => `  ${r.source_id} ${r.relation} ${r.target_id}`).join("\n")}`,
	)
	console.log("")
}

console.log("=== Fixing nm_0484 Gambero imperiale species (TREK-553) ===\n")
report("BEFORE")

const before = nameQuery.get("nm_0484")
if (!before) throw new Error("nm_0484 not found")

// 1. Repoint the species. Idempotent: no-op if already on sp_022.
const moved = db.prepare("UPDATE names SET species_id = 'sp_022' WHERE id = 'nm_0484' AND species_id <> 'sp_022'").run()
console.log(
	moved.changes > 0
		? "Moved nm_0484 to sp_022 (Melicertus kerathurus)"
		: "nm_0484 already on sp_022 — no move needed",
)

// 2. Etymology deliberately untouched — see header comment.
console.log("Etymology on nm_0484 left as-is (word origin only, no species claim)")

// 3. alternate_of, only legal now that both names share sp_022.
const relationInsert = db.prepare(
	`INSERT OR IGNORE INTO name_relations (source_id, target_id, relation, notes)
	 VALUES ('nm_0460', 'nm_0484', 'alternate_of', ?)`,
)
const relResult = relationInsert.run(
	"Both Italian names for Melicertus (Penaeus) kerathurus. 'Mazzancolla' is the standard Italian designation (and the official commercial name); 'Gambero imperiale' is the market name, also the regular term in Sicily alongside 'gambero barbuto'.",
)
console.log(
	relResult.changes > 0
		? "Added: nm_0460 (Mazzancolla) alternate_of nm_0484 (Gambero imperiale)"
		: "Relation nm_0460 alternate_of nm_0484 already present",
)
console.log("")

report("AFTER")
console.log("=== Done ===")
db.close()
