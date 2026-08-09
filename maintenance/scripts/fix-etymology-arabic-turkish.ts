/**
 * Arabic / Turkish etymology dead-end fixes, plus the last two Greek strays
 * and the Trancia deletion — TREK-567, TREK-568, TREK-570
 *
 * Companion to audit-etymology-format.ts, and the sequel to
 * fix-etymology-circular-greek.ts (which cleared the `grc`/`ell` dead ends and
 * left twelve records non-compliant). This script applies the results of a
 * separate sourced research pass verbatim — it does not re-derive them.
 *
 * Six kinds of change, all in one pass so the corpus never sits half-fixed:
 *
 *   A. Nine Arabic/Turkish `circular-etymology` dead ends — etymology replaced
 *      wholesale. Each had a same-language etymon glossed with the headword's
 *      own meaning ("From Arabic gambarī (shrimp)" on the record جمبري), which
 *      restates rather than explains.
 *   B. nm_0205 Abborre and nm_0361 سرغوس — the two `missing-gloss` records that
 *      fix-etymology-circular-greek.ts deliberately left for a later pass.
 *   C. nm_0110 Καβούρι — a factual error found in passing: it cited κάραβος,
 *      which is a different word (crayfish/beetle, the source of καραβίδα
 *      nm_0115). Verified against en.wiktionary κάβουρας before applying.
 *   D. nm_0011 — a one-word gloss for σκάνθαρος, the residual that
 *      fix-etymology-circular-greek.ts documented as KNOWN RESIDUAL.
 *   E. nm_0438 Trancia deleted (it is Italian for a steak/slice of fish, not a
 *      species name) and nm_0432 Trança repaired so it no longer depends on it.
 *   F. Two new borrowed_from relations, both same-species.
 *
 * Idempotent: re-running skips rows that already match, and the delete/insert
 * steps are no-ops once applied.
 *
 * Run: pnpm tsx maintenance/scripts/fix-etymology-arabic-turkish.ts
 *      pnpm tsx maintenance/scripts/audit-etymology-format.ts
 *      pnpm db:validate
 */
import Database from "better-sqlite3";

interface NameFix {
	id: string;
	/** Why this record changed, and what the applied text asserts. */
	rationale: string;
	etymology: string;
}

const NAME_FIXES: NameFix[] = [
	// ------------------------- A. nine Arabic/Turkish circular etymologies
	{
		id: "nm_0080",
		rationale:
			"circular: صوريل was glossed 'horse mackerel' on a horse-mackerel record. It is a French loan; the Greek σαῦρος (lizard) is the naming motive.",
		etymology: [
			"From French saurel (horse mackerel)",
			"↳ From Late Latin saurus (horse mackerel)",
			"↳ From Ancient Greek σαῦρος saûros (lizard; also the horse mackerel)",
		].join("\n"),
	},
	{
		id: "nm_0089",
		rationale:
			"circular: glossed as the ray itself. The word is the bird name 'turtle-dove', short for 'sea dove' — an Aramaic loan, and the pectoral-fin/wing image is the motive.",
		etymology: [
			"From Arabic شِفْنِين šifnīn (turtle-dove), ellipsis of شفنين بحري šifnīn baḥrī (sea dove)",
			"↳ From Aramaic שַׁפְנִינָא šap̄nīnā (turtle-dove)",
		].join("\n"),
	},
	{
		id: "nm_0093",
		rationale:
			"circular: 'From Arabic karkand (lobster)' on the record كركند. The dictionaries only account for the gemstone homonym; asserting uncertainty is the sourced position.",
		etymology: [
			"Origin uncertain in the crustacean sense",
			"The same form is attested from the 13th century (Ibn al-Bayṭār) as the name of a red gemstone, borrowed from Aramaic qarkeḏnā and ultimately of Hittite origin; the lobster sense is not accounted for in the dictionaries",
		].join("\n"),
	},
	{
		id: "nm_0102",
		rationale:
			"circular: glossed 'shrimp' on a shrimp record. Egyptian Arabic جمبري is an Italian loan (gamberi), traceable back to Greek κάμμαρος.",
		etymology: [
			"From Italian gamberi (shrimps), plural of gambero",
			"↳ From Vulgar Latin gambarus, from Latin cammarus (a sea crustacean)",
			"↳ From Ancient Greek κάμμαρος kámmaros (a crustacean)",
		].join("\n"),
	},
	{
		id: "nm_0103",
		rationale:
			"circular: glossed 'shrimp' on a shrimp record. Levantine قريدس is from Greek γαρίδες; the hedge is kept because the Arabic shape may have been remodelled on ق ر د س.",
		etymology: [
			"From Greek γαρίδες garídes (shrimps)",
			"↳ From Ancient Greek καρῖδες karîdes (shrimps), plural of καρίς karís (shrimp)",
			"Derivation likely but not certain; the Arabic form may have been reshaped on the root ق ر د س q-r-d-s",
		].join("\n"),
	},
	{
		id: "nm_0112",
		rationale:
			"circular: glossed 'crab' on a crab record. Egyptian كابوريا is the Greek plural καβούρια, which goes back to Ancient Greek πάγουρος. DEVIATION, flagged: the researched text left the Byzantine and Koine links unglossed, which trips `missing-gloss` on the Byzantine line. (crab) is added to both, taken from the same en.wiktionary κάβουρας entry that section C's nm_0110 text glosses identically — so the two records that share this chain now agree word for word. No new claim is made.",
		etymology: [
			"From Greek καβούρια kavoúria (crabs), plural of καβούρι kavoúri (crab)",
			"↳ From Byzantine Greek κάβουρας kávouras (crab)",
			"↳ From Koine Greek κάβουρος kávouros (crab)",
			"↳ From Ancient Greek πάγουρος págouros (a kind of crab)",
		].join("\n"),
	},
	{
		id: "nm_0132",
		rationale:
			"circular: 'From Turkish kötek (a type of fish)'. The word is the ordinary Turkish 'cudgel', a Persian loan; the transfer to Umbrina cirrosa is undocumented and is flagged as such rather than invented.",
		etymology: [
			"Regional Black Sea name, identical in form to Turkish kötek (cudgel, club)",
			"↳ From Persian کوتنگ kōtang (striking mallet, heavy club), attested in Turkish from 1501 (Câmi-ül Fürs)",
			"The application to Umbrina cirrosa is not documented in Turkish etymological sources",
		].join("\n"),
	},
	{
		id: "nm_0138",
		rationale:
			"circular: 'From Turkish götek (a type of fish)'. It is the Black Sea g-/k- variant of kötek; same Persian source, same undocumented semantic step.",
		etymology: [
			"Black Sea dialect variant of kötek, with initial g- for k- as commonly in Anatolian dialects",
			"↳ From Turkish kötek (cudgel, club), from Persian کوتنگ kōtang (striking mallet, heavy club)",
			"The application to Umbrina cirrosa is not documented in Turkish etymological sources",
		].join("\n"),
	},
	{
		id: "nm_0185",
		rationale:
			"circular: 'From Arabic qārūṣ (sea bass)' on the sea-bass record. No classical attestation and no established donor language, so uncertainty is the sourced answer.",
		etymology: [
			"Origin uncertain; not attested in the classical Arabic dictionaries",
			"Recorded only as a modern Mediterranean Arabic fish name; no Greek, Latin, Coptic or Semitic source has been established",
		].join("\n"),
	},

	// --------------------------------- B. the two unblocked steps (TREK-570)
	{
		id: "nm_0205",
		rationale:
			"missing-gloss on an unciteable 'Proto-Germanic *aburô', and the Old Norse ancestor is wrong — the word has no Old Norse attestation. Replaced with Hellquist (1922) p.1: Old Swedish aghborre, agh- (sharp) + borre (bristle). 'Germanic *burzan' is Hellquist's own notation and is deliberate, not a typo for a reconstruction no dictionary prints.",
		etymology: [
			"From Old Swedish aborre (perch, attested 1506), older aghborre",
			"↳ Compound: agh- (sharp) + borre (bristle)",
			"↳ agh- from PIE *ak- (sharp; cf. agn, ax, egg)",
			"↳ borre from Germanic *burzan (bristle; cf. borste)",
			"Named for the spiny dorsal fin. Old Danish agborre, Danish aborre, Norwegian abbor and Icelandic aborri are cognates, not ancestors; the word has no Old Norse attestation.",
		].join("\n"),
	},
	{
		id: "nm_0361",
		rationale:
			"missing-gloss on 'From Greek Σαργός via Arabic adaptation'. Maʿlūf's Arabic Zoological Dictionary marks سرغوس as Arabized Greek (coasts of al-Shām); Latin sargus has only Romance descendants, so the Latin route is rejected rather than left open.",
		etymology: "From Ancient Greek σαργός sargós (sea bream, sargo)",
	},

	// ------------------------------------------ C. nm_0110, a factual error
	{
		id: "nm_0110",
		rationale:
			"wrong etymon: it cited κάραβος, which is crayfish/beetle and the source of καραβίδα (nm_0115), not of καβούρι. Corrected chain verified against en.wiktionary κάβουρας, which reads verbatim: from Byzantine Greek κάβουρας, from Koine Greek κάβουρος, from Ancient Greek πάγουρος.",
		etymology: [
			"From Byzantine Greek κάβουρας kávouras (crab)",
			"↳ From Koine Greek κάβουρος kávouros (crab)",
			"↳ From Ancient Greek πάγουρος págouros (a kind of crab)",
		].join("\n"),
	},

	// ------------------------------------------------- D. nm_0011 gloss gap
	{
		id: "nm_0011",
		rationale:
			"missing-gloss: σκάνθαρος carried no gloss (the KNOWN RESIDUAL of fix-etymology-circular-greek.ts). el.wiktionary σκαθάρι derives σκαθάρι < σκανθάριον < σκάνθαρος < κάνθαρος with no separate sense, so the minimal supported gloss is 'beetle' — the meaning the next line already spells out for κάνθαρος. Nothing beyond that is asserted.",
		etymology: [
			"From Medieval Greek σκανθάριον skanthárion, from σκάνθαρος skántharos (beetle)",
			"↳ From Ancient Greek κάνθαρος kántharos (dung beetle; also the black seabream Spondyliosoma cantharus)",
			"↳ Origin uncertain; Beekes is sceptical of the proposed derivations from κάνθων kánthōn (pack-ass) and of a Semitic source",
		].join("\n"),
	},

	// ------------------------------------------------ E. nm_0432 made standalone
	{
		id: "nm_0432",
		rationale:
			"its borrowed_from target nm_0438 is deleted below, so the etymology must stand alone. The old text ('From Italian trancia (slice)') was right as far as it went; it is kept and extended with the French source and the naming motive, so nothing it got right is clobbered.",
		etymology: [
			"From Italian trancia (steak, slice), itself from French tranche (slice)",
			"↳ The fish is large and sold cut into steaks",
		].join("\n"),
	},
];

/**
 * E. nm_0438 Trancia is not a fish name. `trancia` is Italian for a steak or
 * slice of any food (Treccani: "fetta di una vivanda"), it combines freely
 * (trancia di tonno / di pesce spada / di salmone), there are zero hits for
 * "tranc" anywhere in DM 22 settembre 2017 (the Italian official name list),
 * and colapisci.it's seven regional names for Dentex gibbosus do not include
 * it. Its two relation rows go first so the FK on name_relations stays valid.
 */
const DELETE_NAME_ID = "nm_0438";
const DELETE_RELATIONS: Array<{ sourceId: string; targetId: string; relation: string }> = [
	{ sourceId: "nm_0438", targetId: "nm_0468", relation: "alternate_of" },
	{ sourceId: "nm_0432", targetId: "nm_0438", relation: "borrowed_from" },
];

/**
 * F. Two borrowings the Greek and Arabic passes surfaced. Both are checked
 * against the same-species constraint that validate-integrity.ts enforces
 * before they are inserted; a mismatch is reported, not forced.
 */
const NEW_RELATIONS: Array<{
	sourceId: string;
	targetId: string;
	relation: string;
	notes: string;
}> = [
	{
		sourceId: "nm_0112",
		targetId: "nm_0110",
		relation: "borrowed_from",
		notes: "Egyptian Arabic كابوريا kābūryā from Greek καβούρια kavoúria, plural of Καβούρι (crab)",
	},
	{
		sourceId: "nm_0103",
		targetId: "nm_0101",
		relation: "borrowed_from",
		notes:
			"Levantine Arabic قريدس quraydis from Greek γαρίδες garídes, plural of Γαρίδα (shrimp); derivation likely but not certain, as the Arabic form may have been reshaped on the root q-r-d-s",
	},
];

function main() {
	const db = new Database("public/fish.db");
	db.pragma("foreign_keys = ON");

	console.log(
		`=== TREK-567 / TREK-568 / TREK-570 Arabic, Turkish and Greek fixes ` +
			`(${NAME_FIXES.length} names, 1 deletion, ${NEW_RELATIONS.length} new relations) ===\n`,
	);

	const selectName = db.prepare("SELECT name, species_id, etymology FROM names WHERE id = ?");
	const selectRelation = db.prepare(
		"SELECT notes FROM name_relations WHERE source_id = ? AND target_id = ? AND relation = ?",
	);

	let changed = 0;
	let skipped = 0;

	const apply = db.transaction(() => {
		// --- A-E: etymology rewrites ---
		for (const fix of NAME_FIXES) {
			const before = selectName.get(fix.id) as
				| { name: string; species_id: string; etymology: string }
				| undefined;
			if (!before) throw new Error(`${fix.id} not found`);

			if (before.etymology === fix.etymology) {
				console.log(`= ${fix.id} ${before.name} already matches, skipped`);
				skipped++;
				continue;
			}

			// updated_at is stamped on every touched row: pnpm db:validate (a step of
			// the Cloudflare build command) rejects NULL, non-ISO-8601 and future values.
			db.prepare(
				"UPDATE names SET etymology = ?, " +
					"updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
			).run(fix.etymology, fix.id);

			changed++;
			console.log(`~ ${fix.id} ${before.name}  [${fix.rationale}]`);
			console.log(`    - ${JSON.stringify(before.etymology)}`);
			console.log(`    + ${JSON.stringify(fix.etymology)}`);
		}

		// --- E: delete nm_0438 and its relations ---
		const doomed = selectName.get(DELETE_NAME_ID) as { name: string } | undefined;
		if (!doomed) {
			console.log(`\n= ${DELETE_NAME_ID} already deleted, skipped`);
			skipped++;
		} else {
			// Guard: only the two known rows may reference it. Anything else means
			// the graph changed since this was researched, so stop rather than
			// silently orphan a citation.
			const touching = db
				.prepare(
					"SELECT source_id, target_id, relation FROM name_relations WHERE source_id = ? OR target_id = ?",
				)
				.all(DELETE_NAME_ID, DELETE_NAME_ID) as Array<{
				source_id: string;
				target_id: string;
				relation: string;
			}>;
			console.log(`\n- ${DELETE_NAME_ID} ${doomed.name}: ${touching.length} relation(s) reference it`);
			for (const r of touching) console.log(`    ${r.source_id} → ${r.target_id} (${r.relation})`);
			if (touching.length !== DELETE_RELATIONS.length)
				throw new Error(
					`expected exactly ${DELETE_RELATIONS.length} relations on ${DELETE_NAME_ID}, found ${touching.length}`,
				);
			for (const want of DELETE_RELATIONS)
				if (
					!touching.some(
						(r) =>
							r.source_id === want.sourceId &&
							r.target_id === want.targetId &&
							r.relation === want.relation,
					)
				)
					throw new Error(
						`expected relation ${want.sourceId} → ${want.targetId} (${want.relation}) not found`,
					);

			const delRel = db.prepare(
				"DELETE FROM name_relations WHERE source_id = ? AND target_id = ? AND relation = ?",
			);
			for (const rel of DELETE_RELATIONS) {
				delRel.run(rel.sourceId, rel.targetId, rel.relation);
				console.log(`    - deleted ${rel.sourceId} → ${rel.targetId} (${rel.relation})`);
				changed++;
			}
			db.prepare("DELETE FROM names WHERE id = ?").run(DELETE_NAME_ID);
			console.log(`    - deleted name ${DELETE_NAME_ID} ${doomed.name}`);
			changed++;
		}

		// --- F: new relations, same-species checked ---
		console.log("");
		const insertRelation = db.prepare(
			"INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)",
		);
		for (const rel of NEW_RELATIONS) {
			const key = `${rel.sourceId} → ${rel.targetId} (${rel.relation})`;
			if (selectRelation.get(rel.sourceId, rel.targetId, rel.relation)) {
				console.log(`= ${key} already exists, skipped`);
				skipped++;
				continue;
			}
			const src = selectName.get(rel.sourceId) as { name: string; species_id: string } | undefined;
			const tgt = selectName.get(rel.targetId) as { name: string; species_id: string } | undefined;
			if (!src || !tgt) {
				console.log(`! ${key} SKIPPED: endpoint missing`);
				skipped++;
				continue;
			}
			// validate-integrity.ts rejects borrowed_from across species.
			if (src.species_id !== tgt.species_id) {
				console.log(
					`! ${key} SKIPPED: species mismatch ${src.species_id} vs ${tgt.species_id}`,
				);
				skipped++;
				continue;
			}
			insertRelation.run(rel.sourceId, rel.targetId, rel.relation, rel.notes);
			changed++;
			console.log(`+ ${key}  [${src.name} → ${tgt.name}, both ${src.species_id}]`);
			console.log(`    notes: ${JSON.stringify(rel.notes)}`);
		}
	});

	apply();

	const nameCount = (db.prepare("SELECT COUNT(*) AS n FROM names").get() as { n: number }).n;
	const relCount = (db.prepare("SELECT COUNT(*) AS n FROM name_relations").get() as { n: number })
		.n;
	db.close();

	console.log(`\n${changed} change(s) applied, ${skipped} already current.`);
	console.log(`names: ${nameCount}, name_relations: ${relCount}`);
	console.log("Verify: pnpm tsx maintenance/scripts/audit-etymology-format.ts");
	console.log("Then:   pnpm db:validate");
}

main();
