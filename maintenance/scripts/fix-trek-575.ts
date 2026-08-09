/**
 * TREK-575 — three loose ends from the species-misfiling work.
 *
 * 1. nm_0190 Sarıağız was on sp_051 Diplodus vulgaris. FishBase lists
 *    "Sariağız" and "Sariağız balığı" under Argyrosomus regius, and gives
 *    Diplodus vulgaris only Karagöz forms (plus Baltakaşkaragöz balığı). So it
 *    moves to sp_099, and the existing relation's premise — "Sarıağız name used
 *    for both species" — turns out to be false. With both endpoints now on
 *    sp_099 the relation is legal, but confused_with is the wrong type: Granyöz
 *    and Sarıağız are simply two Turkish names for the same fish, so it becomes
 *    alternate_of.
 *    https://www.fishbase.se/ComNames/CommonNamesList.php?ID=418&GenusName=Argyrosomus&SpeciesName=regius&StockCode=432
 *    https://www.fishbase.se/ComNames/CommonNamesList.php?ID=1754&GenusName=Diplodus&SpeciesName=vulgaris&StockCode=1946
 *
 * 2. nm_0189 Fangri still said the fish name was "possibly from a Cretan word
 *    for whetstone". TREK-569 established via Beekes that the whetstone φάγρος
 *    is a separate headword with no established connection, and corrected
 *    nm_0191 and nm_0386. This brings the third record into line rather than
 *    leaving three records disagreeing about one word.
 *
 * 3. sp_109 Spicara maena had no English name. "Blotched picarel" is the FAO
 *    English name per FishBase. Its etymology follows nm_0336, the corpus's
 *    other picarel record.
 *    https://www.fishbase.se/ComNames/CommonNamesList.php?ID=4887&GenusName=Spicara&SpeciesName=maena&StockCode=5119
 *
 * Idempotent: re-running reports every item as already current.
 *
 * Run: pnpm tsx maintenance/scripts/fix-trek-575.ts
 */

import Database from "better-sqlite3";
import { resolve } from "node:path";

const DB_PATH = resolve(import.meta.dirname, "../../public/fish.db");
const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

const db = new Database(DB_PATH);
let changed = 0;
let already = 0;

function report(label: string, before: string, after: string) {
	if (before === after) {
		console.log(`  = ${label} — already current`);
		already++;
		return false;
	}
	console.log(`  ~ ${label}`);
	console.log(`      before: ${before.replace(/\n/g, " / ")}`);
	console.log(`      after:  ${after.replace(/\n/g, " / ")}`);
	changed++;
	return true;
}

// ---------------------------------------------------------------- 1. species
{
	const row = db
		.prepare("SELECT species_id FROM names WHERE id = 'nm_0190'")
		.get() as { species_id: string } | undefined;
	if (!row) throw new Error("nm_0190 missing");
	if (report("nm_0190 Sarıağız species", row.species_id, "sp_099")) {
		db.prepare(
			`UPDATE names SET species_id = 'sp_099', updated_at = ${NOW} WHERE id = 'nm_0190'`,
		).run();
	}

	const rel = db
		.prepare(
			"SELECT relation, notes FROM name_relations WHERE source_id='nm_0441' AND target_id='nm_0190'",
		)
		.get() as { relation: string; notes: string | null } | undefined;
	const NOTE =
		"Both are Turkish names for Argyrosomus regius; FishBase lists Granyoz and Sariağız for the species";
	if (rel && report("nm_0441→nm_0190 relation", rel.relation, "alternate_of")) {
		db.prepare(
			"UPDATE name_relations SET relation='alternate_of', notes=? WHERE source_id='nm_0441' AND target_id='nm_0190'",
		).run(NOTE);
		// A relation edit stamps both endpoint names — name_relations has no
		// updated_at of its own, so the name pages are where the change shows.
		db.prepare(
			`UPDATE names SET updated_at = ${NOW} WHERE id IN ('nm_0441','nm_0190')`,
		).run();
	}
}

// -------------------------------------------------------------- 2. etymology
{
	const OLD = db
		.prepare("SELECT etymology FROM names WHERE id='nm_0189'")
		.get() as { etymology: string };
	const NEW = [
		"From Modern Greek φαγκρί fangrí (seabream)",
		"↳ From Ancient Greek φάγρος phágros (red porgy)",
		"↳ Origin uncertain, probably Pre-Greek substrate (Beekes), on the evidence of the variants πάγρος págros and φαγρώριος phagrṓrios",
		"↳ A homonymous Cretan φάγρος phágros (whetstone) is a separate headword; no connection between the two is established",
	].join("\n");
	if (report("nm_0189 Fangri etymology", OLD.etymology, NEW)) {
		db.prepare(
			`UPDATE names SET etymology = ?, updated_at = ${NOW} WHERE id='nm_0189'`,
		).run(NEW);
	}
}

// ------------------------------------------------------------ 3. English name
{
	const exists = db
		.prepare(
			"SELECT id FROM names WHERE name='Blotched picarel' AND species_id='sp_109'",
		)
		.get();
	if (exists) {
		console.log("  = Blotched picarel — already present");
		already++;
	} else {
		const id = "nm_0557";
		const etymology = [
			"Compound: blotched + picarel",
			"blotched: for the dark blotch on the flank, picarel: a small Mediterranean fish",
			"↳ picarel from French picarel (picarel, a small Mediterranean fish)",
		].join("\n");
		db.prepare(
			`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, updated_at)
			 VALUES (?, 'Blotched picarel', 'sp_109', 'international', 'eng', ?, 'Blotched picarel', '[blotched picarel]', ${NOW})`,
		).run(id, etymology);
		console.log(`  + ${id} Blotched picarel (eng) → sp_109`);
		changed++;
	}
}

const counts = db
	.prepare(
		"SELECT (SELECT COUNT(*) FROM names) AS n, (SELECT COUNT(*) FROM species) AS s, (SELECT COUNT(*) FROM name_relations) AS r",
	)
	.get() as { n: number; s: number; r: number };
db.close();

console.log(
	`\n${changed} updated, ${already} already current — ${counts.n} names, ${counts.s} species, ${counts.r} relations`,
);
if (changed > 0) console.log("Commit public/fish.db.");
