/**
 * TREK-586 pass two — sections A, C, D of the GH#62 compiled change list.
 *
 * Pass one (fix-trek-586.ts) added the ten new marine-arthropod species and
 * their vernacular names (section E). This script covers what pass one
 * explicitly deferred:
 *
 *  A. Fix three existing records:
 *     - nm_0091 (Istakoz) — remove an unsupported "From Latin astacus" hop.
 *       name_relations already records nm_0091 borrowed_from nm_0378/nm_0415
 *       (both Greek ἀστακός), so the stored Latin step contradicted the
 *       database's own relations. tr.wiktionary derives ıstakoz directly
 *       from Pontic Greek. Rewritten as a direct Greek borrowing.
 *     - nm_0483 (Dikenli ıstakoz) — the TREK-586 write-up says this one also
 *       routes through Latin. On inspection it does not: its stored
 *       etymology already reads "↳ ıstakoz from Greek αστακός astakós
 *       (lobster)" with no Latin step. Left untouched; logged so the
 *       discrepancy between the task text and the actual row is visible in
 *       the run output rather than silently skipped.
 *     - nm_0422 (Katkarapu) — was stated as fact that katka comes from
 *       katkaista "to cut". Kotus SES (kaino.kotus.fi/ses/, entry katka:1)
 *       marks the derivation uncertain and ties the popular explanation to a
 *       different verb, katketa "to break, snap" (referring to the shrimp
 *       cutting fishing lines) — rewritten to say so.
 *
 *  C. αστακός on sp_088 (Palinurus elephas). It already exists on sp_020
 *     (Homarus, nm_0415) — modern Greek restaurant usage extends the same
 *     word to the spiny lobster, so both rows are legitimate under
 *     validateNoDuplicateNames (name|species_id|region_id). Both etymologies
 *     are rewritten to state the split explicitly and agree with each
 *     other. The word's own origin is not re-derived — it reuses the
 *     already-settled corpus finding from nm_0378: origin uncertain,
 *     probably Pre-Greek substrate (Beekes).
 *
 *  D. Size/stage names:
 *     - Lobster weight ladder on sp_020 (chicken/quarter/select/jumbo, kg),
 *       mirroring the Turkish bluefish pattern (nm_0019..nm_0028) including
 *       its smaller_than direction: source is the smaller grade, target the
 *       next larger one (verified against nm_0019 smaller_than nm_0020 etc).
 *       chicken/quarter/select are plain US/Canada trade-grading vocabulary
 *       with no deeper etymology to invent; jumbo is a real, sourceable one
 *       (via P. T. Barnum's circus elephant Jumbo).
 *     - Blue crab sex terms on sp_023 (jimmy male_of, sook/she-crab
 *       female_of, all -> nm_0108), mirroring the existing grey-mullet
 *       male_of/female_of pair (nm_0400/nm_0401 -> nm_0399).
 *     - Blue crab moult stages on sp_023 (green crab, peeler, buster,
 *       soft-shell, paper-shell, buckram, hard crab) added as names with NO
 *       relations: this is a time sequence, not a size one (a soft-shell
 *       crab is not "smaller than" a hard crab, it is the same animal hours
 *       later), and none of the six relation types in src/db/relations.ts
 *       can express "earlier stage of" without encoding a false claim. The
 *       progression is described in prose within each etymology instead.
 *
 * Idempotent: re-running reports every item as already current.
 *
 * Run: pnpm tsx maintenance/scripts/fix-trek-586-pass2.ts
 */

import Database from "better-sqlite3";
import { resolve } from "node:path";

const DB_PATH = resolve(import.meta.dirname, "../../public/fish.db");
const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

const db = new Database(DB_PATH);

let updated = 0;
let namesAdded = 0;
let relationsAdded = 0;
let alreadyCurrent = 0;

function nextNameId(): string {
	const row = db
		.prepare(
			"SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) AS id FROM names",
		)
		.get() as { id: string };
	return row.id;
}

function updateEtymology(id: string, expectedCurrent: string, next: string) {
	const row = db.prepare("SELECT etymology FROM names WHERE id = ?").get(id) as
		| { etymology: string }
		| undefined;
	if (!row) throw new Error(`Missing name row: ${id}`);
	if (row.etymology === next) {
		console.log(`  = ${id} etymology already current`);
		alreadyCurrent++;
		return;
	}
	if (row.etymology !== expectedCurrent) {
		console.log(`  ! ${id} etymology did not match expected prior text — updating anyway`);
		console.log(`    prior: ${JSON.stringify(row.etymology)}`);
	}
	db.prepare(`UPDATE names SET etymology = ?, updated_at = ${NOW} WHERE id = ?`).run(next, id);
	console.log(`  ~ ${id} etymology updated`);
	updated++;
}

interface NameSpec {
	key: string;
	name: string;
	speciesId: string;
	region: string;
	lang: string;
	etymology: string;
	transliteration: string;
	phonetic: string;
	measurementUnit?: string;
	measurementMin?: number;
	measurementMax?: number | null;
}

const idByKey = new Map<string, string>();

function ensureName(spec: NameSpec): string {
	const existing = db
		.prepare("SELECT id FROM names WHERE name = ? AND species_id = ? AND region_id = ?")
		.get(spec.name, spec.speciesId, spec.region) as { id: string } | undefined;
	if (existing) {
		console.log(`  = name ${spec.name} (${spec.lang}) already exists as ${existing.id}`);
		alreadyCurrent++;
		idByKey.set(spec.key, existing.id);
		return existing.id;
	}
	const id = nextNameId();
	db.prepare(
		`INSERT INTO names (
			id, name, species_id, region_id, lang, etymology, transliteration, phonetic,
			measurement_unit, measurement_min, measurement_max, updated_at
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${NOW})`,
	).run(
		id,
		spec.name,
		spec.speciesId,
		spec.region,
		spec.lang,
		spec.etymology,
		spec.transliteration,
		spec.phonetic,
		spec.measurementUnit ?? null,
		spec.measurementMin ?? null,
		spec.measurementMax ?? null,
	);
	console.log(`  + ${id} ${spec.name} (${spec.lang}) -> ${spec.speciesId}`);
	namesAdded++;
	idByKey.set(spec.key, id);
	return id;
}

function ensureRelation(sourceKey: string, targetKey: string, relation: string, notes: string) {
	const sourceId = idByKey.get(sourceKey);
	const targetId = idByKey.get(targetKey);
	if (!sourceId || !targetId) {
		throw new Error(`Missing name for relation: ${sourceKey} -> ${targetKey}`);
	}
	const existing = db
		.prepare("SELECT 1 FROM name_relations WHERE source_id = ? AND target_id = ? AND relation = ?")
		.get(sourceId, targetId, relation);
	if (existing) {
		console.log(`  = relation ${sourceId} -> ${targetId} (${relation}) already exists`);
		alreadyCurrent++;
		return;
	}
	db.prepare(
		"INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)",
	).run(sourceId, targetId, relation, notes);
	db.prepare(`UPDATE names SET updated_at = ${NOW} WHERE id IN (?, ?)`).run(sourceId, targetId);
	console.log(`  + relation ${sourceId} -> ${targetId} (${relation})`);
	relationsAdded++;
}

console.log("=== TREK-586 pass 2: sections A, C, D ===\n");

// ------------------------------------------------------------------- A.1/A.2
{
	console.log("-- A.1/A.2: remove the unsupported Latin hop --");

	updateEtymology(
		"nm_0091",
		"From Latin astacus (lobster)\n↳ From Greek ἀστακός astakós (lobster, crayfish)",
		"From Ancient Greek ἀστακός astakós (lobster, crayfish)",
	);

	// nm_0483 was flagged in the TREK-586 write-up as also routing through
	// Latin. Its stored text does not: it already reads as a direct Greek
	// borrowing. Verify that rather than blindly overwriting, and log the
	// discrepancy either way.
	const row483 = db.prepare("SELECT etymology FROM names WHERE id = 'nm_0483'").get() as {
		etymology: string;
	};
	if (row483.etymology.includes("Latin")) {
		console.log("  ! nm_0483 unexpectedly still has a Latin step — fixing");
		updateEtymology(
			"nm_0483",
			row483.etymology,
			"Compound: dikenli + ıstakoz\ndikenli: spiny, ıstakoz: lobster\n↳ ıstakoz from Greek αστακός astakós (lobster)",
		);
	} else {
		console.log(
			"  = nm_0483 already has no Latin step (task description did not match the stored row) — no change needed",
		);
		alreadyCurrent++;
	}
}

// ----------------------------------------------------------------------- A.3
{
	console.log("\n-- A.3: nm_0422 Katkarapu — overstated certainty --");
	updateEtymology(
		"nm_0422",
		"Compound: katka + rapu\nkatka: segment/section (from katkaista, to cut), rapu: crab",
		"Compound: katka + rapu\nkatka: origin uncertain, rapu: crab\n↳ Kotus SES (kaino.kotus.fi/ses/, katka:1) leaves the derivation of katka unresolved; a folk explanation ties it to katketa (to break, snap), for the shrimp's habit of severing fishing lines, rather than to katkaista (to cut) as is sometimes claimed",
	);
}

// ------------------------------------------------------------------------- C
{
	console.log("\n-- C: αστακός split across sp_020 (Homarus) and sp_088 (Palinurus) --");

	updateEtymology(
		"nm_0415",
		"From Ancient Greek ἀστακός astakós (lobster, crayfish)",
		"From Ancient Greek ἀστακός astakós (lobster, crayfish); origin uncertain, probably Pre-Greek substrate (Beekes)\n↳ In Modern Greek, αστακός astakós is used formally and in fisheries for the true (clawed) lobster Homarus gammarus, while colloquial and restaurant usage extends the same word to the spiny lobster Palinurus elephas",
	);

	ensureName({
		key: "palinurus:ell:astakos",
		name: "Αστακός",
		speciesId: "sp_088",
		region: "greek",
		lang: "ell",
		etymology:
			"From Ancient Greek ἀστακός astakós (lobster, crayfish); origin uncertain, probably Pre-Greek substrate (Beekes)\n↳ In Modern Greek, colloquial and restaurant usage extends αστακός astakós to the spiny lobster Palinurus elephas, alongside its formal fisheries sense for the true (clawed) lobster Homarus gammarus",
		transliteration: "Astakos",
		phonetic: "/astaˈkos/",
	});
}

// --------------------------------------------------------------- D. Lobster
{
	console.log("\n-- D: lobster weight ladder on sp_020 --");

	ensureName({
		key: "homarus:eng:chicken",
		name: "chicken",
		speciesId: "sp_020",
		region: "international",
		lang: "eng",
		etymology:
			"English chicken (US/Canada lobster trade grade, the smallest legal market size); plain trade-grading vocabulary, from the everyday use of chicken for anything notably small or young, as in the phrase spring chicken — no deeper origin is on record",
		transliteration: "chicken",
		phonetic: "[chicken]",
		measurementUnit: "kg",
		measurementMin: 0.45,
		measurementMax: 0.55,
	});
	ensureName({
		key: "homarus:eng:quarter",
		name: "quarter",
		speciesId: "sp_020",
		region: "international",
		lang: "eng",
		etymology:
			"English quarter (US/Canada lobster trade grade, above chicken); plain trade-grading vocabulary — a market-size label, not a fraction of a specific weight and not a compound with a deeper origin",
		transliteration: "quarter",
		phonetic: "[quarter]",
		measurementUnit: "kg",
		measurementMin: 0.55,
		measurementMax: 0.7,
	});
	ensureName({
		key: "homarus:eng:select",
		name: "select",
		speciesId: "sp_020",
		region: "international",
		lang: "eng",
		etymology:
			"English select (US/Canada lobster trade grade, above quarter); plain trade-grading vocabulary — select in the ordinary sense of chosen or selected stock, with nothing further to it",
		transliteration: "select",
		phonetic: "[select]",
		measurementUnit: "kg",
		measurementMin: 0.7,
		measurementMax: 1.1,
	});
	ensureName({
		key: "homarus:eng:jumbo",
		name: "jumbo",
		speciesId: "sp_020",
		region: "international",
		lang: "eng",
		etymology:
			"English jumbo (US/Canada lobster trade grade, the largest market size)\n↳ jumbo entered general use for anything oversized after Jumbo, the celebrated circus elephant exhibited by P. T. Barnum in the 1880s; the name of that elephant is of uncertain African-language origin, sometimes linked to Swahili jumbe (chief)",
		transliteration: "jumbo",
		phonetic: "[jumbo]",
		measurementUnit: "kg",
		measurementMin: 1.1,
		measurementMax: null,
	});

	// smaller_than direction verified against the Turkish bluefish chain:
	// nm_0019 (smallest) smaller_than nm_0020, ascending — source is always
	// the smaller grade, target the next one up.
	ensureRelation(
		"homarus:eng:chicken",
		"homarus:eng:quarter",
		"smaller_than",
		"Lobster weight-grade progression",
	);
	ensureRelation(
		"homarus:eng:quarter",
		"homarus:eng:select",
		"smaller_than",
		"Lobster weight-grade progression",
	);
	ensureRelation(
		"homarus:eng:select",
		"homarus:eng:jumbo",
		"smaller_than",
		"Lobster weight-grade progression",
	);
}

// ------------------------------------------------------------- D. Blue crab
{
	console.log("\n-- D: blue crab sex terms on sp_023 --");

	idByKey.set("blue-crab-generic", "nm_0108");

	ensureName({
		key: "callinectes:eng:jimmy",
		name: "jimmy",
		speciesId: "sp_023",
		region: "international",
		lang: "eng",
		etymology:
			"English jimmy (Chesapeake dialect term for a mature male blue crab); origin obscure — apparently a use of the personal name Jimmy, not otherwise explained in the available sources",
		transliteration: "jimmy",
		phonetic: "[jimmy]",
	});
	ensureName({
		key: "callinectes:eng:sook",
		name: "sook",
		speciesId: "sp_023",
		region: "international",
		lang: "eng",
		etymology:
			"English sook (Chesapeake dialect term for a mature female blue crab); origin obscure, not securely traced to any other English word",
		transliteration: "sook",
		phonetic: "[sook]",
	});
	ensureName({
		key: "callinectes:eng:she-crab",
		name: "she-crab",
		speciesId: "sp_023",
		region: "international",
		lang: "eng",
		etymology:
			"Compound: she + crab\nshe: female pronoun, crab: crustacean, naming the sex directly\n↳ known chiefly through she-crab soup, a Carolina Lowcountry dish traditionally made with female blue crabs and their roe",
		transliteration: "she-crab",
		phonetic: "[she-crab]",
	});

	ensureRelation("callinectes:eng:jimmy", "blue-crab-generic", "male_of", "jimmy is a mature male blue crab");
	ensureRelation("callinectes:eng:sook", "blue-crab-generic", "female_of", "sook is a mature female blue crab");
	ensureRelation(
		"callinectes:eng:she-crab",
		"blue-crab-generic",
		"female_of",
		"she-crab is a female blue crab",
	);
}

// ------------------------------------------------------ D. Blue crab moults
{
	console.log("\n-- D: blue crab moult stages on sp_023 (no relations) --");

	ensureName({
		key: "callinectes:eng:green-crab",
		name: "green crab",
		speciesId: "sp_023",
		region: "international",
		lang: "eng",
		etymology:
			"English green crab (moult-stage term for a blue crab well before its next moult); green in the horticultural sense of unripe or immature, not a description of shell color",
		transliteration: "green crab",
		phonetic: "[green crab]",
	});
	ensureName({
		key: "callinectes:eng:peeler",
		name: "peeler",
		speciesId: "sp_023",
		region: "international",
		lang: "eng",
		etymology:
			"English peeler (moult-stage term for a blue crab nearing its moult); agent noun of peel, for the crab about to shed its old shell",
		transliteration: "peeler",
		phonetic: "[peeler]",
	});
	ensureName({
		key: "callinectes:eng:buster",
		name: "buster",
		speciesId: "sp_023",
		region: "international",
		lang: "eng",
		etymology:
			"English buster (moult-stage term for a blue crab actively shedding); agent noun of bust (to break open), for the old shell splitting along the back seam",
		transliteration: "buster",
		phonetic: "[buster]",
	});
	ensureName({
		key: "callinectes:eng:soft-shell",
		name: "soft-shell",
		speciesId: "sp_023",
		region: "international",
		lang: "eng",
		etymology:
			"Compound: soft + shell\nsoft: not yet hardened, shell: the crab's exoskeleton\n↳ the moult stage immediately after shedding, before the new shell calcifies",
		transliteration: "soft-shell",
		phonetic: "[soft-shell]",
	});
	ensureName({
		key: "callinectes:eng:paper-shell",
		name: "paper-shell",
		speciesId: "sp_023",
		region: "international",
		lang: "eng",
		etymology:
			"Compound: paper + shell\npaper: thin and papery, shell: the crab's exoskeleton\n↳ the moult stage a little past soft-shell, once the new shell begins to firm up but is still thin and flexible",
		transliteration: "paper-shell",
		phonetic: "[paper-shell]",
	});
	ensureName({
		key: "callinectes:eng:buckram",
		name: "buckram",
		speciesId: "sp_023",
		region: "international",
		lang: "eng",
		etymology:
			"From Middle English bokeram (a coarse stiffened fabric)\n↳ From Old French boquerant, origin uncertain, possibly ultimately named for Bukhara, the Central Asian city\n↳ applied to the moult stage where the new shell has stiffened like the fabric but is not yet fully hard",
		transliteration: "buckram",
		phonetic: "[buckram]",
	});
	ensureName({
		key: "callinectes:eng:hard-crab",
		name: "hard crab",
		speciesId: "sp_023",
		region: "international",
		lang: "eng",
		etymology:
			"Compound: hard + crab\nhard: fully hardened shell, crab: crustacean\n↳ the final moult stage, once the new shell has fully calcified — the end of the progression that begins at green crab",
		transliteration: "hard crab",
		phonetic: "[hard crab]",
	});
}

const counts = db
	.prepare(
		"SELECT (SELECT COUNT(*) FROM names) AS n, (SELECT COUNT(*) FROM species) AS s, (SELECT COUNT(*) FROM name_relations) AS r",
	)
	.get() as { n: number; s: number; r: number };
db.close();

console.log(
	`\n${updated} rows updated, ${namesAdded} names added, ${relationsAdded} relations added, ${alreadyCurrent} already current`,
);
console.log(`Totals now: ${counts.n} names, ${counts.s} species, ${counts.r} relations.`);
if (updated + namesAdded + relationsAdded > 0) console.log("Commit public/fish.db.");
