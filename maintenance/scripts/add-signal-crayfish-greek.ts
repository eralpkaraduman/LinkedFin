/**
 * Add the Greek name for the signal crayfish (sp_120), per explicit instruction.
 *
 * Recorded as a *descriptive* designation rather than an inherited folk name,
 * because that is what the evidence supports: Greek Wikipedia refers to the
 * species as «αμερικανικές καραβίδες» (plural) alongside the scientific
 * binomial, and names only Astacus astacus as Ποτάμια καραβίδα. No Greek
 * vernacular name specific to P. leniusculus could be sourced — the EU
 * commercial-designations database, which would settle it, is behind a
 * human-verification wall. The etymology says this plainly so a later audit
 * does not mistake it for an attested traditional name.
 *
 * Stored in the singular citation form as instructed.
 *
 * Note this is now the THIRD καραβίδα in the database, on a third species:
 *   nm_0115  Καραβίδα   sp_025  Astacus astacus      (native crayfish)
 *   nm_0563  καραβίδα   sp_110  Nephrops norvegicus  (Norway lobster)
 *   nm_0625  Αμερικανική καραβίδα  sp_120            (this one)
 * The qualifier αμερικανική is precisely what distinguishes it, so the
 * etymology points at the other two.
 *
 * Sources:
 * - https://el.wikipedia.org/wiki/Ποτάμια_καραβίδα — «αμερικανικές καραβίδες
 *   (Pacifastacus leniusculus)»; Ποτάμια καραβίδα is Astacus astacus.
 * - καραβίδα < Ancient Greek καραβίς karabís, diminutive of κάραβος kárabos —
 *   the chain already recorded on nm_0114/nm_0564.
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

const ID = "nm_0625";
const SPECIES_ID = "sp_120";
const ENG_ID = "nm_0619"; // Signal crayfish, same species

db.run("BEGIN");
try {
	if (db.query("SELECT id FROM names WHERE id = ?").get(ID)) {
		throw new Error(`${ID} already exists`);
	}

	db.run(
		`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, updated_at)
		 VALUES (?, 'Αμερικανική καραβίδα', ?, 'greek', 'ell', ?, 'Amerikanikí karavída', '/amerikaniˈci karaˈviða/',
		         strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`,
		[
			ID,
			SPECIES_ID,
			`Compound: αμερικανική amerikanikí + καραβίδα karavída
αμερικανική: American (feminine), καραβίδα: crayfish
↳ καραβίδα from Ancient Greek καραβίς karabís (crayfish), a diminutive of κάραβος kárabos (lobster, horned beetle)
A descriptive designation for the introduced North American species rather than an inherited folk name; Greek Wikipedia gives it in the plural, αμερικανικές καραβίδες amerikanikés karavídes. The qualifier does the work: καραβίδα alone denotes the native crayfish Astacus astacus and, in seafood use, the Norway lobster.`,
		],
	);
	console.log(`  ✓ ${ID}  Αμερικανική καραβίδα [ell]`);

	db.run(
		"INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)",
		[
			ID,
			ENG_ID,
			"alternate_of",
			"Greek Αμερικανική καραβίδα ↔ English Signal crayfish (Greek names the species by its origin, not by the claw patch)",
		],
	);
	console.log("  ✓ 1 relation");

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
