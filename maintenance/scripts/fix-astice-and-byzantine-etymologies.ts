/**
 * TREK-564 + TREK-565 — one script, because both write public/fish.db.
 *
 * ============================================================================
 * TREK-564: sp_020 Homarus gammarus had zero Italian names
 * ============================================================================
 *
 * TREK-553 moved nm_0484 "Gambero imperiale" off sp_020 (it is a penaeid
 * prawn name, not a lobster name), which left the European lobster with no
 * Italian name at all. The correct one is "Astice".
 *
 * Source, verified directly from the decree's own species list (not from a
 * secondary summary): DM 22 settembre 2017 n. 19105, "Denominazioni in lingua
 * italiana delle specie ittiche di interesse commerciale" (Gazzetta Ufficiale
 * n. 266, 14/11/2017). The row reads:
 *
 *   Decapoda | Nephropidae | Homarus gammarus | Astice | LBE
 *
 * (the adjacent row is Homarus americanus | Astice americano | LBA, which is
 * why the unqualified "Astice" is specifically gammarus).
 *
 * Etymology: Italian astice < Latin astacus < Ancient Greek ἀστακός. Confirmed
 * against Wiktionary's Italian entry (astice, from Latin astacī/astacus, from
 * ἀστακός), and it matches what nm_0091 "Istakoz" already records for Turkish.
 *
 * Pronunciation: /ˈastitʃe/ — stress on the first syllable (à-sti-ce), the
 * same shape the corpus already uses for nm_0468 "Dentice corazziere"
 * (/ˈdentitʃe .../). Wiktionary gives /ˈas.ti.t͡ʃe/; syllable dots and the tie
 * bar are dropped to match house style.
 *
 * Relation: ἀστακός is already in the corpus as nm_0378, and it sits on
 * sp_020, so a relation is legal (the validator enforces same-species). Added
 * as borrowed_from, mirroring the existing nm_0091 → nm_0378 row.
 *
 * ============================================================================
 * TREK-565 (a): Γοφάρι and its two Turkish relatives — Byzantine step
 * ============================================================================
 *
 * The task described the missing Byzantine form as "γουφάριον". That form is
 * not what the literature attests. The attested Byzantine word is γομφάριον
 * (gomphárion), with -μφ-:
 *
 *   Ephraim Lytle, "One Fish, Two Fish, Bonito, Bluefish: Ancient Greek ἀμία
 *   and γομφάριον", Mnemosyne 69.2 (2016) 249-261. Lytle argues ἀμία is the
 *   bluefish (not the bonito, a misidentification going back to Rondelet),
 *   that ἀμία was displaced by γομφάριον, and that γομφάριον survives, barely
 *   changed, as Modern Greek γοφάρι. His Byzantine attestation is Ioannes
 *   Tzetzes' 12th-century commentary on Oppian.
 *
 * The task's citation of Ptochoprodromos IV.208 could NOT be confirmed and is
 * deliberately not recorded here; Tzetzes is the attestation the article
 * actually rests on. The task's spelling "γουφάριον" looks like a conflation
 * of the Byzantine γομφάριον with the modern dialectal γουφάρι, which is a
 * real and different word — it is the form Turkish actually borrowed.
 *
 * So the corrected chain, consistent across all three records:
 *
 *   Ancient Greek γόμφος (peg, bolt; molar tooth)
 *     → Byzantine Greek γομφάριον (bluefish)         [diminutive]
 *       → Modern Greek γοφάρι            = nm_0024
 *       → Modern Greek γουφάρι  → Turkish Lüfer      = nm_0023
 *       → Modern Greek γουφαίνα → Turkish Kofana     = nm_0027
 *
 * nm_0024 previously jumped straight from γόμφος, dropping the Byzantine
 * diminutive that is the whole point of the derivation; nm_0023 and nm_0027
 * stopped at the modern Greek form and never reached Greek antiquity at all.
 * The γουφάρι/γουφαίνα → Turkish step is kept because it is correct
 * (Nişanyan: lüfer < γουφάρι, kofana < γουφαίνα < γόμφος).
 *
 * ============================================================================
 * TREK-565 (b): Ζαργάνα is Medieval, and its source word was mis-glossed
 * ============================================================================
 *
 * The task's claim holds: there is no LSJ⁹ fish entry behind ζαργάνα, and the
 * word first surfaces in Medieval/Byzantine Greek. But the records were wrong
 * in a second way the task did not flag — they gave the source as "σαργάνα
 * sargána (garfish)", i.e. they glossed the etymon with the meaning of the
 * derivative. The source word means nothing of the kind:
 *
 *   - ζαργάνα < Medieval Greek ζαργάνα, probably from Hellenistic σαργάνη
 *     "plait, braid; plaited basket" — Babiniotis, Ετυμολογικό Λεξικό της
 *     Νέας Ελληνικής Γλώσσας (2009), and the Triantafyllides ΛΚΝ (1998),
 *     both cited in the Greek Wiktionary entry for ζαργάνα.
 *   - LSJ has σαργάνη only as "plait, plaited basket" (the 2 Cor 11:33 word),
 *     with no fish sense, and has no entry for ζαργάνα at all — which is
 *     exactly the distinction "From Greek" was flattening.
 *
 * Kriaras vol. 7 and Opsarologos 252, cited by the task as the medieval
 * attestation, could not be consulted directly (Kriaras' online edition is not
 * reachable); the Medieval dating is instead carried by Babiniotis and ΛΚΝ,
 * which is why the etymologies say "Medieval Greek" and cite no line number.
 *
 * ============================================================================
 *
 * Idempotent: every write is conditional on the current value, and the
 * relation insert is INSERT OR IGNORE. Re-running prints "no change".
 * Every touched name row is stamped with updated_at; the relation stamps
 * both of its endpoints (name_relations has no timestamp of its own).
 */
import Database from "better-sqlite3"

const db = new Database("public/fish.db")

const NEW_NAME_ID = "nm_0556"
const ASTAKOS_ID = "nm_0378" // Ancient Greek ἀστακός, already on sp_020

/** Ancient Greek γόμφος → Byzantine γομφάριον, shared tail of all three bluefish chains. */
const GOMPHOS_TAIL = [
	"↳ From Byzantine Greek γομφάριον gomphárion (bluefish)",
	"↳ From Ancient Greek γόμφος gómphos (peg, bolt; molar tooth)",
]

/** Medieval ζαργάνα → Hellenistic σαργάνη, shared tail of all three garfish chains. */
const SARGANE_TAIL = "↳ From Hellenistic Greek σαργάνη sargánē (plait, braided basket)"

const ETYMOLOGY_UPDATES: { id: string; etymology: string }[] = [
	{
		id: "nm_0024", // Γοφάρι (Modern Greek)
		etymology: [
			"From Byzantine Greek γομφάριον gomphárion (bluefish)",
			"↳ From Ancient Greek γόμφος gómphos (peg, bolt; molar tooth)",
		].join("\n"),
	},
	{
		id: "nm_0023", // Lüfer (Turkish)
		etymology: ["From Greek γουφάρι goufári (bluefish)", ...GOMPHOS_TAIL].join("\n"),
	},
	{
		id: "nm_0027", // Kofana (Turkish)
		etymology: ["From Greek γουφαίνα goufaína (large bluefish)", ...GOMPHOS_TAIL].join("\n"),
	},
	{
		id: "nm_0235", // Ζαργάνα (Modern Greek)
		etymology: [
			"From Medieval Greek ζαργάνα zargána (garfish), with no Ancient Greek antecedent in the fish sense",
			SARGANE_TAIL,
		].join("\n"),
	},
	{
		id: "nm_0232", // Zargana (Turkish, Black Sea)
		etymology: [
			"From Greek ζαργάνα zargána (garfish), first attested in Medieval Greek",
			SARGANE_TAIL,
		].join("\n"),
	},
	{
		id: "nm_0233", // Sargan (Turkish, Aegean)
		etymology: [
			"From Greek ζαργάνα zargána (garfish), first attested in Medieval Greek",
			SARGANE_TAIL,
		].join("\n"),
	},
]

const REPORT_IDS = [...ETYMOLOGY_UPDATES.map((u) => u.id), NEW_NAME_ID, ASTAKOS_ID]

type NameRow = {
	id: string
	name: string
	lang: string
	species_id: string
	region_id: string
	etymology: string
	transliteration: string
	phonetic: string
	updated_at: string | null
}

const nameQuery = db.prepare<[string], NameRow>("SELECT * FROM names WHERE id = ?")
const italianCount = db.prepare<[], { c: number }>(
	"SELECT COUNT(*) AS c FROM names WHERE species_id = 'sp_020' AND lang = 'ita'",
)
const relQuery = db.prepare<[string], { source_id: string; target_id: string; relation: string }>(
	"SELECT source_id, target_id, relation FROM name_relations WHERE source_id = ? OR target_id = ?",
)

/** Every write goes through this so the stamp can never be forgotten. */
const stamp = "updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')"
const setEtymology = db.prepare(
	`UPDATE names SET etymology = ?, ${stamp} WHERE id = ? AND etymology <> ?`,
)
const stampOnly = db.prepare(`UPDATE names SET ${stamp} WHERE id = ?`)

function report(label: string) {
	console.log(`--- ${label} ---`)
	console.log(`sp_020 Italian names: ${italianCount.get()?.c}`)
	for (const id of REPORT_IDS) {
		const row = nameQuery.get(id)
		if (!row) {
			console.log(`${id}: (absent)`)
			continue
		}
		console.log(`${row.id} (${row.lang}) ${row.name} [${row.updated_at ?? "NULL"}]`)
		for (const line of row.etymology.split("\n")) console.log(`    ${line}`)
	}
	const rels = relQuery.all(NEW_NAME_ID, NEW_NAME_ID)
	console.log(
		rels.length === 0
			? `relations on ${NEW_NAME_ID}: none`
			: `relations on ${NEW_NAME_ID}: ${rels.map((r) => `${r.source_id} ${r.relation} ${r.target_id}`).join(", ")}`,
	)
	console.log("")
}

console.log("=== TREK-564 (Astice) + TREK-565 (Byzantine etymologies) ===\n")
report("BEFORE")

db.transaction(() => {
	// --- TREK-564: the missing Italian name -------------------------------
	const astakos = nameQuery.get(ASTAKOS_ID)
	if (!astakos) throw new Error(`${ASTAKOS_ID} (ἀστακός) not found`)
	if (astakos.species_id !== "sp_020") {
		throw new Error(`${ASTAKOS_ID} is on ${astakos.species_id}, not sp_020 — relation would be illegal`)
	}

	const existing = nameQuery.get(NEW_NAME_ID)
	if (existing && existing.name !== "Astice") {
		throw new Error(`${NEW_NAME_ID} is already taken by "${existing.name}" — pick a fresh id`)
	}
	const inserted = db
		.prepare(
			`INSERT OR IGNORE INTO names
			   (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, updated_at)
			 VALUES (?, ?, 'sp_020', 'italy', 'ita', ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ','now'))`,
		)
		.run(
			NEW_NAME_ID,
			"Astice",
			["From Latin astacus (lobster)", "↳ From Ancient Greek ἀστακός astakós (lobster, crayfish)"].join("\n"),
			"Astice",
			"/ˈastitʃe/",
		)
	console.log(
		inserted.changes > 0
			? `Added ${NEW_NAME_ID} "Astice" (ita, italy) on sp_020 — DM 22/09/2017, FAO LBE`
			: `${NEW_NAME_ID} "Astice" already present — no insert`,
	)

	const rel = db
		.prepare(
			`INSERT OR IGNORE INTO name_relations (source_id, target_id, relation, notes)
			 VALUES (?, ?, 'borrowed_from', ?)`,
		)
		.run(
			NEW_NAME_ID,
			ASTAKOS_ID,
			"Italian Astice from Latin astacus, itself a borrowing of Ancient Greek ἀστακός",
		)
	if (rel.changes > 0) {
		// name_relations has no updated_at by design — stamp both endpoints instead.
		stampOnly.run(NEW_NAME_ID)
		stampOnly.run(ASTAKOS_ID)
		console.log(`Added relation ${NEW_NAME_ID} borrowed_from ${ASTAKOS_ID} (both endpoints stamped)`)
	} else {
		console.log(`Relation ${NEW_NAME_ID} borrowed_from ${ASTAKOS_ID} already present`)
	}

	// --- TREK-565: the six etymology corrections --------------------------
	for (const { id, etymology } of ETYMOLOGY_UPDATES) {
		const row = nameQuery.get(id)
		if (!row) throw new Error(`${id} not found`)
		const res = setEtymology.run(etymology, id, etymology)
		console.log(res.changes > 0 ? `Updated etymology on ${id} (${row.name})` : `${id} (${row.name}) already correct — no change`)
	}
})()

console.log("")
report("AFTER")
console.log("=== Done ===")
db.close()
