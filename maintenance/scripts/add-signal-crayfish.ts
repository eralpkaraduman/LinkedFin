/**
 * Add the signal crayfish (Pacifastacus leniusculus) and its Nordic names.
 *
 * Why this species: sp_025 (Astacus astacus) already *names* the signal crayfish
 * in its notes — "populations reduced to ~5% by crayfish plague carried by
 * invasive North American signal crayfish" — so the database referred to an
 * animal it did not contain. The Finnish name Jokirapu (nm_0421, "river
 * crayfish") is also a retronym: it only needs the joki- qualifier because
 * täplärapu arrived. Half of a contrastive pair was present without the other.
 *
 * Sources:
 * - https://en.wikipedia.org/wiki/Pacifastacus_leniusculus
 *   Species authority, description, native range, 1960s introduction, and the
 *   naming motivation: "Reminiscent of the white flags that signalmen used for
 *   directing trains, this light patch is responsible for the species' common
 *   name."
 * - https://en.wiktionary.org/wiki/täplä — täplä (spot, speck) < Proto-Finnic
 *   *täplä; täplärapu listed as a derived term.
 * - https://en.wiktionary.org/wiki/kräfta — kräfta < Old Swedish krævet <
 *   Old Saxon krevit < Proto-West Germanic *krabit.
 * - https://en.wiktionary.org/wiki/signalkräfta — compound of signal + kräfta.
 * - https://no.wikipedia.org/wiki/Signalkreps — signalkreps is the standard
 *   Norwegian name; permanently established, "svært høy risiko".
 *
 * Deliberately NOT asserted: that the Scandinavian names were borrowed or
 * calqued from English "signal crayfish". It is the obvious reading — the
 * species was imported from North America and every Germanic name carries the
 * same signal- element — but Wiktionary's signalkräfta entry states no such
 * derivation, so the names are linked as alternate_of (the convention already
 * used for Ahven↔Abborre, Hauki↔Gädda) rather than borrowed_from.
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

const SPECIES_ID = "sp_120";
const ENG_ID = "nm_0619";
const FIN_ID = "nm_0620";
const SWE_ID = "nm_0621";
const NOR_ID = "nm_0622";

const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ', 'now')";

console.log("=== Adding signal crayfish (Pacifastacus leniusculus) ===\n");

db.run("BEGIN");
try {
	// 1. Species. Notes describe the animal only — no language names, per the
	//    /add-species quality bar.
	db.run(
		`INSERT INTO species (id, scientific_name, notes, updated_at)
		 VALUES (?, 'Pacifastacus leniusculus', ?, ${NOW})`,
		[
			SPECIES_ID,
			"Freshwater crayfish typically 6-9 cm long, reaching 16-20 cm. Smooth carapace, brown to reddish above, with a distinctive white to pale blue-green patch at the hinge of each claw. Native to the Columbia River basin of western North America. Introduced to Europe from 1960 and established in 27 countries by 2009. A largely resistant carrier of crayfish plague (Aphanomyces astaci), which is fatal to European crayfish.",
		],
	);
	console.log(`1. species ${SPECIES_ID}  Pacifastacus leniusculus`);

	// 2. English. The crayfish element repeats the chain already recorded on
	//    nm_0117 (European crayfish), so the two entries agree.
	db.run(
		`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, updated_at)
		 VALUES (?, 'Signal crayfish', ?, 'international', 'eng', ?, 'Signal crayfish', '[signal crayfish]', ${NOW})`,
		[
			ENG_ID,
			SPECIES_ID,
			`Compound: signal + crayfish
signal: the pale patch at the hinge of the claw, likened to the white flags signalmen used to direct trains, crayfish: freshwater crustacean
↳ crayfish from Old French crevice (crayfish)
↳ From Frankish *krebit (crayfish), related to German Krebs (crab)`,
		],
	);
	console.log(`2. name    ${ENG_ID}  Signal crayfish [eng]`);

	// 3. Finnish. Note the motivation differs from the Germanic names: täplä
	//    names the patch as a *spot*, not as a signal.
	db.run(
		`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, updated_at)
		 VALUES (?, 'Täplärapu', ?, 'finland', 'fin', ?, 'Taplarapu', '/ˈtæplæˌrɑpu/', ${NOW})`,
		[
			FIN_ID,
			SPECIES_ID,
			`Compound: täplä + rapu
täplä: spot, speck, rapu: crayfish
↳ täplä from Proto-Finnic *täplä (spot)
Names the same pale claw marking as the Germanic names, but as a spot rather than as a signal.`,
		],
	);
	console.log(`3. name    ${FIN_ID}  Täplärapu [fin]`);

	// 4. Swedish.
	db.run(
		`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, updated_at)
		 VALUES (?, 'Signalkräfta', ?, 'sweden', 'swe', ?, 'Signalkrafta', '/sɪŋˈnɑːlˌkrɛfta/', ${NOW})`,
		[
			SWE_ID,
			SPECIES_ID,
			`Compound: signal + kräfta
signal: signal, for the pale patch at the hinge of the claw, kräfta: crayfish
↳ kräfta from Old Swedish krævet (crayfish)
↳ From Old Saxon krevit (crayfish)
↳ From Proto-West Germanic *krabit (crayfish)`,
		],
	);
	console.log(`4. name    ${SWE_ID}  Signalkräfta [swe]`);

	// 5. Norwegian.
	db.run(
		`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, updated_at)
		 VALUES (?, 'Signalkreps', ?, 'norway', 'nor', ?, 'Signalkreps', '/sɪŋˈnɑːlˌkrɛps/', ${NOW})`,
		[
			NOR_ID,
			SPECIES_ID,
			`Compound: signal + kreps
signal: signal, for the pale patch at the hinge of the claw, kreps: crayfish
↳ kreps related to Swedish kräfta (crayfish) and German Krebs (crab)`,
		],
	);
	console.log(`5. name    ${NOR_ID}  Signalkreps [nor]`);

	// 6. Relations. name_relations is same-species constrained, so the genuinely
	//    interesting link — täplärapu vs. the native jokirapu on sp_025 — cannot
	//    be recorded here and lives in the etymology prose instead.
	const relations: Array<[string, string, string, string]> = [
		[
			FIN_ID,
			SWE_ID,
			"alternate_of",
			"Finnish Täplärapu ↔ Swedish Signalkräfta (signal crayfish)",
		],
		[
			SWE_ID,
			NOR_ID,
			"alternate_of",
			"Swedish Signalkräfta ↔ Norwegian Signalkreps (signal crayfish)",
		],
	];
	for (const [source, target, relation, notes] of relations) {
		db.run(
			"INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)",
			[source, target, relation, notes],
		);
	}
	console.log(`6. ${relations.length} relations`);

	db.run("COMMIT");
	console.log("\n✓ committed");
} catch (error) {
	db.run("ROLLBACK");
	console.error("\n✗ rolled back:", error);
	process.exit(1);
}

const counts = db
	.query(
		"SELECT (SELECT COUNT(*) FROM species) AS species, (SELECT COUNT(*) FROM names) AS names, (SELECT COUNT(*) FROM name_relations) AS relations",
	)
	.get() as { species: number; names: number; relations: number };
console.log(
	`  totals: ${counts.names} names / ${counts.species} species / ${counts.relations} relations`,
);
