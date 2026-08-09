/**
 * Greek etymology dead-end fixes — TREK-567, TREK-566
 *
 * Companion to audit-etymology-format.ts. The `circular-etymology` rule flags
 * records whose etymology restates the headword ("From Ancient Greek σκόμβρος
 * skómbros (mackerel)" on the record σκόμβρος): a dead end, not a derivation.
 * Clearing it needs sourced philology, not formatting, so this script applies
 * the results of a separate research pass verbatim — it does not re-derive
 * them. Beekes = Etymological Dictionary of Greek; LSJ = Liddell-Scott-Jones.
 *
 * Four kinds of change, all in one pass so the corpus never sits half-fixed:
 *
 *   A. Nine `grc` dead ends  — etymology replaced wholesale.
 *   B. Two headword corrections — the `name` column itself was misaccented and
 *      returns nothing in any lexicon (σάργος → σαργός, σαλπή → σάλπη). The
 *      phonetic moves with the accent; the ASCII transliterations are
 *      accent-blind and stay as they are.
 *   C. Four `ell` dead ends  — etymology replaced wholesale.
 *   D. nm_0419 — romanization added and the χήμη claim softened (TREK-566).
 *   E. Propagated errors — the same wrong gloss or accent copied into records
 *      outside the thirteen. Fixing only one side would leave the corpus
 *      self-contradictory, so those citations are harmonised here too,
 *      including two name_relations notes that quote the old headwords.
 *
 * KNOWN RESIDUAL: nm_0011's first line cites σκάνθαρος skántharos without a
 * gloss, so it trades its `circular-etymology` finding for a `missing-gloss`
 * one. The sourced text is applied as written rather than reworded — inventing
 * a gloss for that intermediate would be unsourced.
 *
 * nm_0361 (apc سرغوس) is deliberately untouched; a separate pass owns it.
 *
 * Idempotent: re-running skips rows that already match.
 *
 * Run: pnpm tsx maintenance/scripts/fix-etymology-circular-greek.ts
 *      pnpm tsx maintenance/scripts/audit-etymology-format.ts
 *      pnpm db:validate
 */
import Database from "better-sqlite3";

interface NameFix {
	id: string;
	/** Why this record changed, and what the applied text asserts. */
	rationale: string;
	etymology?: string;
	name?: string;
	phonetic?: string;
	transliteration?: string;
}

const NAME_FIXES: NameFix[] = [
	// ------------------------------------------------- A. nine grc dead ends
	{
		id: "nm_0367",
		rationale:
			"circular: λάβραξ was glossed 'sea bass' on the record λάβραξ. Real source is the adjective λάβρος; the greedy sense is the naming motive, and LSJ glosses λάβραξ itself as bass.",
		etymology: [
			"From λάβρος lábros (furious, fierce, greedy)",
			"↳ The fish was proverbially greedy in antiquity; LSJ glosses λάβραξ as bass (Labrax lupus)",
		].join("\n"),
	},
	{
		id: "nm_0369",
		rationale: "circular: σκόμβρος glossed 'mackerel' on the record σκόμβρος. Beekes: Pre-Greek substrate.",
		etymology: [
			"Origin uncertain, probably Pre-Greek substrate (Beekes)",
			"↳ Latin scomber and the Romance and Turkish fish names descend from it",
		].join("\n"),
	},
	{
		id: "nm_0371",
		rationale: "circular: ἔγχελυς glossed 'eel' on the record ἔγχελυς. Replaced with the PIE eel-word and its cognates.",
		etymology: [
			"From PIE *h₂engʷʰ- (water-worm, eel)",
			"↳ Cognate with Latin anguilla (eel), Lithuanian ungurỹs, Old Prussian angurgis, Russian у́горь úgorʹ, Albanian ngjalë",
			"↳ Form influenced by ἔχις échis (snake), as Latin anguilla was influenced by anguis (snake)",
			"↳ No single PIE form is reconstructable; the irregular variation across daughter languages is usually attributed to taboo",
		].join("\n"),
	},
	{
		id: "nm_0373",
		rationale: "circular: τρίγλη glossed 'red mullet' on the record τρίγλη. Real source is τρίζω, from the grunting sound.",
		etymology: [
			"From τρίζω trízō (to crackle, creak)",
			"↳ Named for the grunting sound the fish makes from friction of the gill-cover bones when taken out of the water",
		].join("\n"),
	},
	{
		id: "nm_0374",
		rationale:
			"circular + headword: σάργος glossed 'seabream' on the record σάργος, and the headword itself was misaccented — the oxytone σαργός is the attested form (nm_0193 and nm_0195 already cite it that way). Phonetic stress moves to the final syllable to match; the ASCII transliteration is unaffected.",
		name: "σαργός",
		phonetic: "/sar.ɡós/",
		etymology: [
			"Origin uncertain, perhaps Pre-Greek substrate (Beekes)",
			"↳ Borrowed into Latin as sargus, whence Italian sarago and English sargo",
		].join("\n"),
	},
	{
		id: "nm_0378",
		rationale:
			"circular: ἀστακός glossed 'lobster, crayfish' on the record ἀστακός. Beekes: Pre-Greek, and the ὀστέον derivation is rejected.",
		etymology: [
			"Origin uncertain, probably Pre-Greek substrate (Beekes)",
			"↳ Often analysed as a derivative of ὀστέον ostéon (bone), but this is highly improbable",
		].join("\n"),
	},
	{
		id: "nm_0379",
		rationale: "circular: καρίς glossed 'shrimp, prawn' on the record καρίς. Beekes vs Frisk both recorded.",
		etymology: [
			"Origin uncertain, possibly Pre-Greek substrate (Beekes)",
			"↳ Frisk instead took it as a shortened popular form of κάραβος kárabos (a kind of crayfish; beetle)",
			"↳ The element kar- recurs in crustacean and scorpion names across the region (compare Persian xarčang, Old Armenian karič)",
		].join("\n"),
	},
	{
		id: "nm_0381",
		rationale: "circular: τευθίς glossed 'squid, cuttlefish' on the record τευθίς. Beekes: Pre-Greek on the τεῦθος variant.",
		etymology: [
			"Origin uncertain, probably Pre-Greek substrate (Beekes), on the evidence of the variant τεῦθος teûthos and the meaning",
			"↳ Earlier attempts are unconvincing: Pokorny compared Sanskrit dodhati (turbulent), Schindler proposed an original colour term",
		].join("\n"),
	},
	{
		id: "nm_0391",
		rationale:
			"circular + headword: σαλπή glossed 'salema, dreamfish' on the record σαλπή, and the headword was misaccented — the paroxytone σάλπη is the lexicon form. Phonetic stress moves to the first syllable; the ASCII transliteration is unaffected.",
		name: "σάλπη",
		phonetic: "/sál.pɛː/",
		etymology: [
			"Origin uncertain, possibly from Egyptian",
			"↳ Compare Coptic ϫⲉⲗϥⲁⲧ jelfat and ⲥⲗⲃⲟⲧ slbot, Arabic شِلْبَا šilbā",
			"↳ Or perhaps already Pre-Greek, the Egyptian and Greek forms sharing a common source (Beekes)",
		].join("\n"),
	},

	// ------------------------------------------------- C. four ell dead ends
	{
		id: "nm_0011",
		rationale:
			"circular: 'From Greek skathári (black seabream)' restated the headword. Chain now runs back through Medieval σκανθάριον to Ancient κάνθαρος. NOTE: the sourced first line cites σκάνθαρος without a gloss, so the audit will report missing-gloss here; applied as researched rather than reworded.",
		etymology: [
			"From Medieval Greek σκανθάριον skanthárion, from σκάνθαρος skántharos",
			"↳ From Ancient Greek κάνθαρος kántharos (dung beetle; also the black seabream Spondyliosoma cantharus)",
			"↳ Origin uncertain; Beekes is sceptical of the proposed derivations from κάνθων kánthōn (pack-ass) and of a Semitic source",
		].join("\n"),
	},
	{
		id: "nm_0184",
		rationale:
			"circular: 'From Greek lavráki (sea bass)' restated the headword. Now traced through the Medieval diminutive to λάβραξ and its adjective λάβρος, matching nm_0367.",
		etymology: [
			"From Medieval Greek λαβράκιον lavrákion, diminutive of Ancient Greek λάβραξ lábrax (sea bass)",
			"↳ From λάβρος lábros (furious, fierce, greedy)",
		].join("\n"),
	},
	{
		id: "nm_0239",
		rationale:
			"circular: 'From Greek bakaliáros (cod-like fish)' restated the headword. The word is an Italian loan going back to Dutch kabeljauw; the competing accounts of the Dutch word are kept as competing.",
		etymology: [
			"From Italian baccalaro (dialectal baccagliaro; standard Italian baccalà, dried salt cod)",
			"↳ From Portuguese bacalhau (cod), compare Spanish bacalao and Catalan bacallà",
			"↳ From Dutch kabeljauw (cod), origin uncertain",
			"↳ Possibly a metathesis of Medieval Latin cabellauwus, or from Latin baculum (stick) for the rods the split fish was dried on; a Basque source bakailao has also been proposed",
		].join("\n"),
	},
	{
		id: "nm_0246",
		rationale:
			"circular: 'From Greek γαύρος gaúros (anchovy)' restated the headword. Real source is ἔγγραυλος with r-dissimilation; Strömberg's γρυλίζω account is recorded and rejected.",
		etymology: [
			"From Medieval Greek ἔγγραυλος éngraulos (anchovy), via *γλαύρος glávros and *γραυρος gravros with dissimilation of the two r-sounds",
			"↳ From Ancient Greek ἔγγραυλις éngraulis (European anchovy), origin unexplained (Beekes)",
			"↳ Strömberg's derivation from an unattested *ἐγγραυλίζω, related to γρυλίζω grylízō (to grunt), founders on the αυ/υ variation",
		].join("\n"),
	},

	// ------------------------------------------------------------ D. nm_0419
	{
		id: "nm_0419",
		rationale:
			"TREK-566: romanizations added for χηβάδα and χήμη, the mis-romanized chímē corrected to chḗmē, the gloss corrected to the attested gaping/clam sense, and the χάσκω link softened from 'related to' to the hedged 'usually taken as a verbal noun to'.",
		etymology:
			"From Medieval Greek χηβάδα chēváda, from Ancient Greek χήμη chḗmē (gaping; clam, mussel), origin uncertain but usually taken as a verbal noun to χάσκω cháskō (to gape, yawn) from PIE *ǵʰeh₁y- (to gape, be wide open). The prothetic α- developed from the phrase μια χηβάδα. Correct spelling: αχηβάδα.",
	},

	// -------------------------------------------------- E. propagated errors
	{
		id: "nm_0183",
		rationale:
			"propagated: glossed λάβραξ as 'voracious fish', which is the sense of the adjective λάβρος, not of λάβραξ — LSJ glosses λάβραξ as bass. Gloss only; the record is otherwise untouched.",
		etymology: [
			"From Modern Greek λαβράκι lavráki (sea bass)",
			"↳ From Ancient Greek λάβραξ lábrax (sea bass)",
		].join("\n"),
	},
	{
		id: "nm_0091",
		rationale:
			"propagated: glossed ἀστακός as 'large sea creature/lobster', not an LSJ sense. Harmonised to the gloss used by nm_0378 and nm_0556.",
		etymology: ["From Latin astacus (lobster)", "↳ From Greek ἀστακός astakós (lobster, crayfish)"].join("\n"),
	},
	{
		id: "nm_0041",
		rationale: "propagated: cited the misaccented σαλπή salpḗ. Corrected to σάλπη sálpē, matching nm_0391.",
		etymology: ["From Ancient Greek σάλπη sálpē (salema)", "↳ Pre-Greek substrate word, origin uncertain"].join("\n"),
	},
	{
		id: "nm_0479",
		rationale:
			"propagated (beyond the brief, same error): cited the misaccented σαλπή salpḗ in its final step. Corrected to σάλπη sálpē; the Modern Greek σάλπα/σάρπα steps above are already right and are untouched.",
		etymology: [
			"From Greek σάρπα sárpa (salema)",
			"↳ Variant of σάλπα sálpa with r/l alternation",
			"↳ From Ancient Greek σάλπη sálpē (Pre-Greek substrate, origin uncertain)",
		].join("\n"),
	},
	{
		id: "nm_0160",
		rationale: "propagated: πέρκη romanized pérke, missing the macron on the eta. nm_0314 has pérkē right.",
		etymology: ["From Latin perca (perch)", "↳ From Greek πέρκη pérkē (spotted)"].join("\n"),
	},
	{
		id: "nm_0326",
		rationale: "propagated: ἀθερίνη romanized atheríne, missing the macron on the final eta.",
		etymology: "From Ancient Greek ἀθερίνη (atherínē, sand smelt)",
	},
];

/** name_relations notes quote the two corrected headwords; PK is (source, target, relation). */
const RELATION_FIXES: { sourceId: string; targetId: string; relation: string; rationale: string; notes: string }[] = [
	{
		sourceId: "nm_0193",
		targetId: "nm_0374",
		relation: "borrowed_from",
		rationale: "quoted the misaccented σάργος; the target headword is now σαργός.",
		notes: "Sargoz from Ancient Greek σαργός",
	},
	{
		sourceId: "nm_0041",
		targetId: "nm_0391",
		relation: "borrowed_from",
		rationale: "quoted the misaccented σαλπή; the target headword is now σάλπη.",
		notes: "Modern Greek Σάλπα from Ancient Greek σάλπη",
	},
];

function main() {
	const db = new Database("public/fish.db");
	db.pragma("foreign_keys = ON");

	console.log(`=== TREK-567 / TREK-566 Greek etymology fixes (${NAME_FIXES.length} names, ${RELATION_FIXES.length} relations) ===\n`);

	const selectName = db.prepare(
		"SELECT name, etymology, transliteration, phonetic FROM names WHERE id = ?",
	);
	const selectRelation = db.prepare(
		"SELECT notes FROM name_relations WHERE source_id = ? AND target_id = ? AND relation = ?",
	);
	const updateRelation = db.prepare(
		"UPDATE name_relations SET notes = ? WHERE source_id = ? AND target_id = ? AND relation = ?",
	);

	let changed = 0;
	let skipped = 0;

	const apply = db.transaction(() => {
		for (const fix of NAME_FIXES) {
			const before = selectName.get(fix.id) as
				| { name: string; etymology: string; transliteration: string; phonetic: string }
				| undefined;
			if (!before) throw new Error(`${fix.id} not found`);

			const columns: string[] = [];
			for (const col of ["name", "etymology", "transliteration", "phonetic"] as const) {
				const want = fix[col];
				if (want !== undefined && want !== before[col]) columns.push(col);
			}

			if (columns.length === 0) {
				console.log(`= ${fix.id} already matches, skipped`);
				skipped++;
				continue;
			}

			// updated_at is stamped on every touched row: pnpm db:validate (a step of
			// the Cloudflare build command) rejects NULL, non-ISO-8601 and future values.
			db.prepare(
				`UPDATE names SET ${columns.map((c) => `${c} = ?`).join(", ")}, ` +
					"updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
			).run(...columns.map((c) => fix[c] as string), fix.id);

			changed++;
			console.log(`~ ${fix.id}  [${fix.rationale}]`);
			for (const col of columns) {
				console.log(`  ${col}`);
				console.log(`    - ${JSON.stringify(before[col as keyof typeof before])}`);
				console.log(`    + ${JSON.stringify(fix[col as keyof NameFix])}`);
			}
		}

		for (const fix of RELATION_FIXES) {
			const key = `${fix.sourceId}->${fix.targetId} (${fix.relation})`;
			const before = selectRelation.get(fix.sourceId, fix.targetId, fix.relation) as
				| { notes: string | null }
				| undefined;
			if (!before) throw new Error(`relation ${key} not found`);
			if (before.notes === fix.notes) {
				console.log(`= ${key} already matches, skipped`);
				skipped++;
				continue;
			}
			updateRelation.run(fix.notes, fix.sourceId, fix.targetId, fix.relation);
			changed++;
			console.log(`~ ${key}  [${fix.rationale}]`);
			console.log(`    - ${JSON.stringify(before.notes)}`);
			console.log(`    + ${JSON.stringify(fix.notes)}`);
		}
	});

	apply();
	db.close();

	console.log(`\n${changed} updated, ${skipped} already current.`);
	console.log("Verify: pnpm tsx maintenance/scripts/audit-etymology-format.ts");
	console.log("Then:   pnpm db:validate");
}

main();
