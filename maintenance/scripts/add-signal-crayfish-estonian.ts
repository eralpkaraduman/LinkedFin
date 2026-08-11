/**
 * Add the two Estonian names for the signal crayfish (sp_120).
 *
 * Estonian has BOTH motivations that the other languages split between:
 * signaalvähk names the claw patch as a signal (like Swedish/Norwegian/English)
 * and tähnikvähk names it as a spot (like Finnish täplärapu). Both are current.
 *
 * Sources:
 * - https://et.wikipedia.org/wiki/Signaalvähk — gives signaalvähk and tähnikvähk
 *   as the Estonian names; invasive, first detected 2008 Mustjõgi, 2010 Riksu
 *   oja (Saaremaa), 2012 Vääna jõgi; relocation prohibited.
 * - https://en.wiktionary.org/wiki/vähk — vähk (crayfish; also cancer the
 *   disease) < Proto-Finnic *vähi, borrowed from Proto-Baltic; cf. Latvian
 *   vēzis, Lithuanian vėžys. IPA /ˈvæhk/.
 * - EKI (Eesti Keele Instituut) ÕS/EKSS via arhiiv.eki.ee and sonaveeb.ee —
 *   tähn "laik, täpp, märk" (spot, dot, mark); tähnik "spotted".
 *
 * Greek is deliberately absent: no Greek vernacular name for this species could
 * be sourced. Greek Wikipedia names only Astacus astacus (Ποτάμια καραβίδα) and
 * refers to this one as «αμερικανικές καραβίδες» — a description, not a name.
 * The EU commercial-designations database, which would settle it, is behind a
 * human-verification wall. Inventing «σηματοφόρος καραβίδα» would be a guess.
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

const SPECIES_ID = "sp_120";
const SIGNAAL_ID = "nm_0623";
const TAHNIK_ID = "nm_0624";
const TAPLARAPU = "nm_0620"; // Finnish, sp_120
const SIGNALKRAFTA = "nm_0621"; // Swedish, sp_120

const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ', 'now')";

// Shared tail: the Baltic origin of vähk, which is the mirror image of Finnish
// rapu being a Germanic loan on the very same animal.
const VAHK_CHAIN = `↳ vähk from Proto-Finnic *vähi (crayfish)
↳ Borrowed from Proto-Baltic, compare Latvian vēzis (crayfish) and Lithuanian vėžys (crayfish)`;

db.run("BEGIN");
try {
	for (const [id] of [[SIGNAAL_ID], [TAHNIK_ID]]) {
		const clash = db.query("SELECT id FROM names WHERE id = ?").get(id);
		if (clash) throw new Error(`${id} already exists`);
	}

	db.run(
		`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, updated_at)
		 VALUES (?, 'Signaalvähk', ?, 'estonia', 'est', ?, 'Signaalvahk', '/ˈsiɡnaːlˌvæhk/', ${NOW})`,
		[
			SIGNAAL_ID,
			SPECIES_ID,
			`Compound: signaal + vähk
signaal: signal, for the pale patch at the hinge of the claw, vähk: crayfish
${VAHK_CHAIN}
Estonian took its crayfish word from Baltic, where neighbouring Finnish rapu is a Germanic loan.`,
		],
	);
	console.log(`  ✓ ${SIGNAAL_ID}  Signaalvähk [est]`);

	db.run(
		`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, updated_at)
		 VALUES (?, 'Tähnikvähk', ?, 'estonia', 'est', ?, 'Tahnikvahk', '/ˈtæhnikˌvæhk/', ${NOW})`,
		[
			TAHNIK_ID,
			SPECIES_ID,
			`Compound: tähnik + vähk
tähnik: spotted, from tähn (spot, mark), vähk: crayfish
${VAHK_CHAIN}
Names the pale claw patch as a spot, like Finnish täplärapu, where signaalvähk names it as a signal.`,
		],
	);
	console.log(`  ✓ ${TAHNIK_ID}  Tähnikvähk [est]`);

	const relations: Array<[string, string, string, string]> = [
		[
			SIGNAAL_ID,
			TAHNIK_ID,
			"alternate_of",
			"Estonian Signaalvähk ↔ Tähnikvähk (signal crayfish; signal vs. spot naming)",
		],
		[
			TAHNIK_ID,
			TAPLARAPU,
			"alternate_of",
			"Estonian Tähnikvähk ↔ Finnish Täplärapu (both name the claw patch as a spot)",
		],
		[
			SIGNAAL_ID,
			SIGNALKRAFTA,
			"alternate_of",
			"Estonian Signaalvähk ↔ Swedish Signalkräfta (both name the claw patch as a signal)",
		],
	];
	for (const [source, target, relation, notes] of relations) {
		db.run(
			"INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)",
			[source, target, relation, notes],
		);
	}
	console.log(`  ✓ ${relations.length} relations`);

	db.run("COMMIT");
	console.log("\n✓ committed");
} catch (error) {
	db.run("ROLLBACK");
	console.error("\n✗ rolled back:", error);
	process.exit(1);
}

const c = db
	.query(
		"SELECT (SELECT COUNT(*) FROM species) s, (SELECT COUNT(*) FROM names) n, (SELECT COUNT(*) FROM name_relations) r",
	)
	.get() as { s: number; n: number; r: number };
console.log(`  totals: ${c.n} names / ${c.s} species / ${c.r} relations`);
