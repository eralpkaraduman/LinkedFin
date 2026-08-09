/**
 * TREK-573 + TREK-574 — etymology defects and species reassignments.
 *
 * Both tasks write `public/fish.db`, which is binary, so they share one
 * idempotent script. Re-running it is a no-op: every write sets an exact
 * target value, the new species/name use INSERT OR IGNORE, and the stale
 * relation is removed with a plain DELETE.
 *
 * Run:  pnpm tsx maintenance/scripts/fix-trek-573-574.ts
 *
 * ---------------------------------------------------------------------------
 * TREK-573 — the six defects the improved audit (TREK-571) surfaced
 * ---------------------------------------------------------------------------
 *
 * Part A, notation only (the meanings were already present, just in the wrong
 * place): AGENTS.md puts compound part meanings on a following `part: meaning`
 * gloss line, not inline in the "Compound:" head.
 *
 *   nm_0097 Χταπόδι — head keeps the romanizations, meanings move down.
 *   nm_0151 Silakka — same, and it was the final line so nothing followed it.
 *
 * Part B, four unglossed source words. Two of them turned out to be claim
 * problems rather than gloss problems:
 *
 *   nm_0034 دنيس — gloss only. Proto-Turkic *teŋiŕ means "sea / large body of
 *     water", from *teŋ (lake) + *-iŕ.
 *     https://en.wiktionary.org/wiki/Reconstruction:Proto-Turkic/te%C5%8Bi%C5%95
 *     https://en.wiktionary.org/wiki/deniz
 *
 *   nm_0141 Ahven — the line named no word, and there is no word to name. The
 *     Kotus SES (Suomen etymologinen sanakirja, the online SSA) entry for
 *     "ahven" gives Finnic cognates plus a Saami equation, i.e. depth to
 *     Finno-Samic and no further; it reconstructs no Proto-Uralic etymon, and
 *     explicitly calls the proposed Baltic and Germanic sources improbable
 *     ("Epätodennäköisiä ovat esitetyt oletukset sanan baltt t. germ
 *     alkuperästä"). So the line is deleted and replaced by an honest hedge —
 *     no form is invented to fill the slot.
 *     https://kaino.kotus.fi/ses/?p=article&etym_id=ETYM_12b308fced90a8d8b6a83b5d6cea43be&word=ahven
 *
 *   nm_0142 Hauki — "Proto-Uralic *šawka" is not what the sources say. SES has
 *     no Proto-Uralic etymon at all; it reports a proposed Slavic loan,
 *     "< kantasl *šč(i̯)aukā (> ven ščúka 'hauki')", and a newer view (KR 2021)
 *     that Proto-Finnic and Proto-Slavic both took the word from a lost
 *     unknown language. So this is a correction, not a gloss.
 *     https://kaino.kotus.fi/ses/?p=article&etym_id=ETYM_8a10f72d1243a5cca8569dbbf7288a6d&word=hauki
 *
 *   nm_0163 Zander — the ↳ asserted descent from Middle Low German sandāt.
 *     Pfeifer's Etymologisches Wörterbuch at DWDS does not say that. It lists
 *     the German forms as a chronological series — omd. czandas (c. 1400),
 *     mnd. sandāt (15th c.), obd. sandat/zandet/sandel (16th c.), nhd. Zander
 *     (first half of the 18th c.) — and attributes the whole series to one
 *     borrowing: "entlehnt aus apomoran. *sądač", cf. poln. sandacz, russ.
 *     sudák (судак). Of the source word it says flatly "Der Name ist
 *     ungeklärt." So MLG sandāt is a sibling reflex of the same borrowing, not
 *     the ancestor, and the Slavic word itself is unexplained.
 *     https://www.dwds.de/wb/etymwb/Zander
 *
 * ---------------------------------------------------------------------------
 * TREK-574 — two Greek names filed under the wrong species
 * ---------------------------------------------------------------------------
 *
 * Both moves were confirmed against FishBase before anything was touched
 * (the TREK-553 lesson: a reassignment inferred from a name's meaning is only
 * safe once a source confirms it).
 *
 *   nm_0191 Φαγκρί: sp_051 Diplodus vulgaris → sp_082 Pagrus pagrus.
 *     FishBase lists Φαγγρί / Fagri (Greece) under Pagrus pagrus, and does not
 *     list any fangri/phagri form among the 117 common names of Diplodus
 *     vulgaris (whose Greek names are Σπάρος, Καραγκιόζης, Κακαρέλλος …).
 *     https://www.fishbase.se/ComNames/CommonNamesList.php?ID=1756&GenusName=Pagrus&SpeciesName=pagrus&StockCode=1249
 *     https://www.fishbase.se/ComNames/CommonNamesList.php?ID=1754&GenusName=Diplodus&SpeciesName=vulgaris&StockCode=1950
 *
 *   nm_0189 Fangri (Turkish) moves with it. It is not in the task text, but the
 *     `nm_0189 borrowed_from nm_0191` relation is same-species-constrained and
 *     would have become illegal. Deleting the relation would have been the
 *     wrong repair: FishBase lists "Fangri" and "Fangri balığı" (Turkey) under
 *     Pagrus pagrus too, so nm_0189 was misfiled for the same reason and the
 *     borrowing is real. Same source as above.
 *
 *   nm_0393 μαινίς: sp_073 Spicara smaris → sp_109 Spicara maena (new).
 *     FishBase Greek names for S. maena are Μενίδα, Μένουλα, Μέλαινα … and for
 *     S. smaris are Μαρίδα, Σμαρίδα, Μαύρη μαρίδα — the μαιν-/μεν- forms sit on
 *     maena, the σμαρ- forms on smaris. That matches nm_0393's own etymology
 *     (derivative of μαίνη, blotched picarel) and nm_0320 Μαρίδα ← σμαρίς.
 *     https://www.fishbase.se/ComNames/CommonNamesList.php?ID=4887&GenusName=Spicara&SpeciesName=maena&StockCode=5119
 *     https://www.fishbase.se/ComNames/CommonNamesList.php?ID=1766&GenusName=Spicara&SpeciesName=smaris&StockCode=1962
 *
 *   Relation `nm_0320 Μαρίδα borrowed_from nm_0393 μαινίς` is deleted. It is
 *     illegal after the move (borrowed_from requires the same species) and it
 *     was already superseded on the facts: TREK-569 established that Μαρίδα
 *     comes from σμαρίς via the accusative σμαρίδα, not from μαινίς. Both
 *     endpoint names are stamped, per the AGENTS.md relation-edit rule.
 */
import Database from "better-sqlite3";

const db = new Database("public/fish.db");

const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

interface NameRow {
	id: string;
	name: string;
	species_id: string;
	etymology: string;
	updated_at: string | null;
}

function showName(id: string): NameRow {
	return db.prepare("SELECT id, name, species_id, etymology, updated_at FROM names WHERE id = ?").get(id) as NameRow;
}

function report(label: string, before: NameRow, after: NameRow) {
	console.log(`\n--- ${label}: ${before.id} ${before.name} ---`);
	if (before.species_id !== after.species_id) {
		console.log(`  species BEFORE: ${before.species_id}`);
		console.log(`  species AFTER : ${after.species_id}`);
	}
	if (before.etymology !== after.etymology) {
		console.log(`  etymology BEFORE:\n${indent(before.etymology)}`);
		console.log(`  etymology AFTER :\n${indent(after.etymology)}`);
	}
	if (before.etymology === after.etymology && before.species_id === after.species_id) {
		console.log("  (no change — already at target)");
	}
	console.log(`  updated_at: ${before.updated_at} -> ${after.updated_at}`);
}

function indent(s: string): string {
	return s
		.split("\n")
		.map((l) => `    | ${l}`)
		.join("\n");
}

/** Sets etymology (and stamps) only when it differs, so re-runs stay quiet. */
function setEtymology(id: string, label: string, etymology: string) {
	const before = showName(id);
	if (before.etymology !== etymology) {
		db.prepare(`UPDATE names SET etymology = ?, updated_at = ${NOW} WHERE id = ?`).run(etymology, id);
	}
	report(label, before, showName(id));
}

function moveSpecies(id: string, label: string, speciesId: string) {
	const before = showName(id);
	if (before.species_id !== speciesId) {
		db.prepare(`UPDATE names SET species_id = ?, updated_at = ${NOW} WHERE id = ?`).run(speciesId, id);
	}
	report(label, before, showName(id));
}

const run = db.transaction(() => {
	console.log("=== TREK-573: etymology defects ===");

	// --- Part A: notation only -------------------------------------------------

	// nm_0097 Χταπόδι. The part meanings ("eight", "foot") were inline in the
	// Compound: head; house style wants the head to carry the forms plus their
	// romanization and the meanings to sit on the following gloss line.
	setEtymology(
		"nm_0097",
		"TREK-573A compound gloss",
		[
			"From Byzantine Greek ὀκταπόδιον (oktapódion, diminutive of ὀκτάπους)",
			"↳ From Ancient Greek ὀκτάπους (oktápous, eight-footed)",
			"↳ Variant form: ὀκτώπους (oktṓpous)",
			"↳ Compound: ὀκτώ (oktṓ) + πούς (poús)",
			"ὀκτώ: eight, πούς: foot",
			"The diminutive ὀκταπόδιον evolved phonetically into modern χταπόδι (initial vowel lost, -ιον suffix reduced).",
		].join("\n"),
	);

	// nm_0151 Silakka. Same defect, and the Compound: line was the last line, so
	// there was no gloss line at all underneath it.
	setEtymology(
		"nm_0151",
		"TREK-573A compound gloss",
		["From Swedish sillake (salted herring)", "↳ Compound: sill + lake", "sill: herring, lake: brine"].join("\n"),
	);

	// --- Part B: missing glosses, with two claim corrections -------------------

	// nm_0034 دنيس. Pure gloss: Wiktionary reconstructs Proto-Turkic *teŋiŕ as
	// "sea, large body of water", from *teŋ (lake) + *-iŕ.
	setEtymology(
		"nm_0034",
		"TREK-573B gloss",
		[
			"From Turkish deniz (sea)",
			"↳ Via Ottoman Turkish, from Proto-Turkic *teŋiŕ (sea, large body of water), from *teŋ (lake)",
		].join("\n"),
	);

	// nm_0141 Ahven. The "↳ From Proto-Uralic" line named no word, and SES gives
	// no Proto-Uralic etymon to name — the equation reaches Saami and stops.
	// Line deleted rather than filled with an invented reconstruction.
	setEtymology(
		"nm_0141",
		"TREK-573B unsupported step removed",
		[
			"From Proto-Finnic *ahven (perch)",
			"↳ Origin uncertain: SES reconstructs no Proto-Uralic etymon, and judges the proposed Baltic and Germanic sources improbable",
		].join("\n"),
	);

	// nm_0142 Hauki. "Proto-Uralic *šawka" is unsupported — SES has no
	// Proto-Uralic etymon here at all, and the form it does cite is Proto-Slavic.
	setEtymology(
		"nm_0142",
		"TREK-573B misattributed etymon corrected",
		[
			// Head line left exactly as it was — this task is about the ↳ step.
			"From Proto-Finnic *haugi (pike)",
			"↳ Origin uncertain: SES reconstructs no Proto-Uralic etymon, and reports instead a proposed loan from Proto-Slavic *šč(i̯)aukā (pike), the source of Russian щука ščúka (pike)",
			"↳ A newer proposal takes the Finnic and Slavic words alike from an unidentified lost language, so the direction of borrowing is not settled",
		].join("\n"),
	);

	// nm_0163 Zander. Fixes the missing gloss and the descent claim together:
	// Pfeifer/DWDS derives the whole German series from one Old Pomeranian
	// borrowing, so MLG sandāt is a sibling reflex, not the ancestor.
	setEtymology(
		"nm_0163",
		"TREK-573B descent claim corrected",
		[
			"From German Zander (pikeperch)",
			"↳ Borrowed from Old Pomeranian *sądač (pikeperch), per Pfeifer at DWDS",
			"↳ Earlier German reflexes of that same borrowing, not ancestors of the modern word: East Central German czandas around 1400, Middle Low German sandāt in the 15th century, and Upper German sandat, zandet and sandel in the 16th century, all naming the same fish; Zander itself is first attested in the early 18th century",
			"↳ The Slavic word is itself unexplained; compare Polish sandacz (pikeperch) and Russian судак sudák (pikeperch)",
		].join("\n"),
	);

	console.log("\n\n=== TREK-574: species reassignments ===");

	// Spicara maena did not exist. notes describe the animal, not its names.
	const maena = db.prepare("SELECT id, scientific_name, notes FROM species WHERE scientific_name = ?").get("Spicara maena");
	if (maena) {
		console.log(`\n--- species Spicara maena already present as ${(maena as { id: string }).id} ---`);
	} else {
		db.prepare(
			`INSERT INTO species (id, scientific_name, notes, updated_at) VALUES (?, ?, ?, ${NOW})`,
		).run(
			"sp_109",
			"Spicara maena",
			"Blotched picarel. Small sparid of the Mediterranean, Black Sea and eastern Atlantic from Portugal to the Canaries, reaching about 25 cm. A protogynous hermaphrodite that feeds on zooplankton over sand, mud, rock and Posidonia beds at 30-130 m; minor commercial value.",
		);
		console.log("\n--- species CREATED: sp_109 Spicara maena ---");
		console.log("  notes: Blotched picarel. Small sparid of the Mediterranean, Black Sea and eastern Atlantic ...");
	}

	// The two Pagrus moves.
	moveSpecies("nm_0191", "TREK-574 move (FishBase: Φαγγρί = Pagrus pagrus)", "sp_082");
	moveSpecies("nm_0189", "TREK-574 move (FishBase: Fangri = Pagrus pagrus)", "sp_082");

	// The Spicara move.
	moveSpecies("nm_0393", "TREK-574 move (FishBase: μαιν-/μεν- names = Spicara maena)", "sp_109");

	// The relation that both breaks the same-species constraint and contradicts
	// the corrected nm_0320 etymology.
	const rel = db
		.prepare("SELECT source_id, target_id, relation, notes FROM name_relations WHERE source_id = ? AND target_id = ? AND relation = ?")
		.get("nm_0320", "nm_0393", "borrowed_from");
	console.log("\n--- relation nm_0320 -> nm_0393 borrowed_from ---");
	if (rel) {
		console.log(`  BEFORE: ${JSON.stringify(rel)}`);
		db.prepare("DELETE FROM name_relations WHERE source_id = ? AND target_id = ? AND relation = ?").run(
			"nm_0320",
			"nm_0393",
			"borrowed_from",
		);
		// A relation edit stamps both endpoint names (AGENTS.md).
		db.prepare(`UPDATE names SET updated_at = ${NOW} WHERE id IN ('nm_0320','nm_0393')`).run();
		console.log("  AFTER : deleted (cross-species after the move, and Μαρίδα is from σμαρίς, not μαινίς)");
	} else {
		console.log("  (already absent — no change)");
	}
});

run();

console.log("\n=== post-state ===");
for (const id of ["nm_0034", "nm_0097", "nm_0141", "nm_0142", "nm_0151", "nm_0163", "nm_0189", "nm_0191", "nm_0320", "nm_0393"]) {
	const r = showName(id);
	console.log(`${r.id} ${r.name} [${r.species_id}] updated_at=${r.updated_at}`);
}

db.close();
