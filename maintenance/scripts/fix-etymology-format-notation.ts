/**
 * Etymology notation fixes — the 22 formatting-only records of TREK-554
 *
 * Companion to audit-etymology-format.ts. The audit reports 56 non-compliant
 * records in three mechanical categories plus `missing-gloss`. Only the
 * mechanical ones are handled here:
 *
 *   quoted-meaning (10)                — the gloss is already in the record,
 *                                        just wrapped in quotes. AGENTS.md:
 *                                        "(tooth)" not "\"tooth\"".
 *   compound-gloss (9)                 — the parts are already glossed inline on
 *                                        the "Compound:" head; AGENTS.md puts the
 *                                        head bare and the glosses on the line
 *                                        below, repeating the head words.
 *   missing-translit-in-etymology (3)  — a Greek word cited without its
 *                                        romanization. Deterministic; the
 *                                        romanization convention is the one
 *                                        already used in the same record
 *                                        (σκορπίδι skorpídi, θύννος thýnnos).
 *
 * THIS IS A NOTATION PASS. No claim in any record changes: every meaning written
 * below is copied from the text already stored in that same record. The audit
 * checks shape, not truth, so nothing here may quietly restate what a record
 * asserts. The one exception is flagged inline: nm_0311 ("Compound: sea + trout")
 * carried no gloss at all and needed two English words supplied.
 *
 * The 34 `missing-gloss` records are deliberately untouched — each needs a
 * meaning that is not in the record, which is sourcing work, not formatting.
 *
 * Idempotent: re-running skips records that already match.
 *
 * Run: pnpm tsx maintenance/scripts/fix-etymology-format-notation.ts
 *      pnpm db:validate
 */
import Database from "better-sqlite3";

interface EtymologyFix {
	id: string;
	/** Why this record changed, and where the wording came from. */
	rationale: string;
	etymology: string;
}

const ETYMOLOGY_FIXES: EtymologyFix[] = [
	// ---------------------------------------------------------------- compound-gloss
	{
		id: "nm_0061",
		rationale:
			"compound-gloss: inline glosses (short/stumpy), (snout) moved off the head onto the gloss line, which now repeats the Greek head words; wording unchanged",
		etymology: [
			"Compound: κουτσο- koutso- + μούρα moúra",
			"κουτσο- koutso-: short/stumpy, μούρα moúra: snout (fish with short snout)",
		].join("\n"),
	},
	{
		id: "nm_0311",
		rationale:
			"compound-gloss: THE ONE EXCEPTION — 'Compound: sea + trout' had no gloss line at all, so the two English words had to be supplied. Glossed in the same descriptive style as nm_0026 (blue: ..., fish: generic term) and nm_0162 (pike: ..., perch: fish type). No etymological claim is added.",
		etymology: ["Compound: sea + trout", "sea: marine habitat, trout: fish type"].join("\n"),
	},
	{
		id: "nm_0325",
		rationale:
			"compound-gloss: gloss line now repeats the Greek head words alongside their existing romanizations (house style, cf. nm_0002); meanings Christ / fish unchanged",
		etymology: ["Compound: Χριστός + ψάρι", "Χριστός Christós: Christ, ψάρι psári: fish"].join("\n"),
	},
	{
		id: "nm_0345",
		rationale: "compound-gloss: inline (gypsy) and (bonito) moved from the head to the gloss line verbatim",
		etymology: ["Compound: çingene + palamut", "çingene: gypsy, palamut: bonito"].join("\n"),
	},
	{
		id: "nm_0346",
		rationale: "compound-gloss: inline (chestnut) and (bonito) moved from the head to the gloss line verbatim",
		etymology: ["Compound: kestane + palamut", "kestane: chestnut, palamut: bonito"].join("\n"),
	},
	{
		id: "nm_0357",
		rationale:
			"compound-gloss: inline (herring) and (of Pontus/Black Sea) moved to the gloss line; romanizations rénga / tou Póntou are the standard transliteration of the words already in the head (AGENTS.md Greek table: γγ→ng, ου→ou)",
		etymology: [
			"Compound: Ρέγγα rénga + του Πόντου tou Póntou",
			"Ρέγγα rénga: herring, του Πόντου tou Póntou: of Pontus/Black Sea",
		].join("\n"),
	},
	{
		id: "nm_0364",
		rationale:
			"compound-gloss: inline (scorpion) and (of the sea) moved to the gloss line verbatim; head left in the record's own DIN-31635 romanization rather than re-segmenting the Arabic script",
		etymology: ["Compound: ʿaqrab + al-baḥr", "ʿaqrab: scorpion, al-baḥr: of the sea"].join("\n"),
	},
	{
		id: "nm_0365",
		rationale: "compound-gloss: inline (dragon) and (of the sea) moved to the gloss line verbatim",
		etymology: ["Compound: tinnīn + al-baḥr", "tinnīn: dragon, al-baḥr: of the sea"].join("\n"),
	},
	{
		id: "nm_0389",
		rationale:
			"compound-gloss: inline (gold) and (eyebrow) moved to the gloss line; the em-dash remark about the golden stripe and both ↳ lines are carried over word for word",
		etymology: [
			"Compound: χρυσός chrysós + ὀφρύς ophrýs",
			"χρυσός chrysós: gold, ὀφρύς ophrýs: eyebrow — describes the golden stripe between the eyes, the species' distinguishing mark",
			"↳ Attested in Aristotle, Historia Animalium — the standard learned name in classical antiquity",
			"↳ Distinct from the folk name ἵππουρος híppouros (horse-tail), which originally denoted dolphinfish but whose descendant τσιπούρα later transferred to this species",
		].join("\n"),
	},

	// ------------------------------------------------- missing-translit-in-etymology
	{
		id: "nm_0133",
		rationale:
			"missing-translit: μύλος → mýlos, κόπτω → kóptō. Romanization only; glosses (mill) and (to strike) already in the record, and the same scheme is used on the line above (μυλοκόπι mylokópi)",
		etymology: [
			"From Greek μυλοκόπι mylokópi (mill-striker)",
			"↳ From μύλος mýlos (mill) + κόπτω kóptō (to strike)",
		].join("\n"),
	},
	{
		id: "nm_0260",
		rationale:
			"missing-translit: σκορπιός → skorpiós, matching the record's own σκορπίδι skorpídi on the line above; gloss (scorpion) unchanged",
		etymology: ["From Greek σκορπίδι skorpídi (little scorpion)", "↳ From σκορπιός skorpiós (scorpion)"].join(
			"\n",
		),
	},
	{
		id: "nm_0324",
		rationale:
			"missing-translit: the romanization thýnō was already inside the parentheses; moved beside the Greek word (house style word translit (meaning)), matching θύννος thýnnos above",
		etymology: ["From Ancient Greek θύννος thýnnos (tuna)", "↳ From θύνω thýnō (to rush)"].join("\n"),
	},

	// ----------------------------------------------------------------- quoted-meaning
	{
		id: "nm_0245",
		rationale: "quoted-meaning: quotes dropped from the cited Turkish form ançüez; text otherwise identical",
		etymology: [
			"From Ottoman Turkish خمسی (hamsı)",
			"↳ From Greek χαμψί (champsí, anchovy)",
			"↳ Possibly from a Black Sea substrate (uncertain ultimate origin)",
			"Distinct from the Romance/Italian ançüez (a salted-anchovy paste, not a fish name) which entered Turkish via French anchois (Italian acciuga). Both ultimately relate to anchovies but came through different borrowing chains: hamsi via Greek χαμψί, ançüez via the Romance ἀφύη lineage.",
		].join("\n"),
	},
	{
		id: "nm_0250",
		rationale: "quoted-meaning: quotes dropped from the cited Laz forms sipa / sipai; text otherwise identical",
		etymology:
			"Laz-origin regional name (Rize / E. Black Sea); attested in Laz dialect as sipa / sipai (Azlaga-Hopa area). Meaning undocumented; distinct from standard istavrit.",
	},
	{
		id: "nm_0256",
		rationale:
			"quoted-meaning: the quoted gloss becomes an unquoted gloss inside the existing parentheses; quotes dropped from the cited form pisi balığı",
		etymology:
			"From Ancient Greek ψῆττα (psētta, a type of flatfish, rhombus). First documented in Turkish by Evliya Çelebi in 1665 as pisi balığı. Related to scientific name Psetta maxima.",
	},
	{
		id: "nm_0258",
		rationale:
			"quoted-meaning: quotes dropped from every cited form (floundre, flydhra, flynder, flundra, Platichthys); the three quoted glosses to spread / flat / fish become parenthesized glosses. Same words, house notation.",
		etymology:
			"From Anglo-French floundre (c. 1300), from Old Norse flydhra, from Proto-Germanic *flunthrjo, from PIE root *plat- (to spread) — reflecting the flat body. Cognates: Danish flynder, Swedish flundra. Platichthys from Greek platys (flat) + ichthys (fish).",
	},
	{
		id: "nm_0261",
		rationale: "quoted-meaning: quotes dropped from the descriptive phrase rainbow-like; text otherwise identical",
		etymology:
			"From Laz language (Lazca), a South Caucasian language spoken in the Hopa region. Regional Black Sea term for a 15-20cm colorful rock fish with rainbow-like appearance. Standard Turkish: iskorpit.",
	},
	{
		id: "nm_0263",
		rationale:
			"quoted-meaning: quotes dropped from the cited forms (scorpion, fish, Scorpion, skorpios, Scorpaena, skorpaina, Porcus); the quoted glosses to cut and pig become parenthesized. No claim changed.",
		etymology:
			"Compound (1655-65): scorpion + fish — the venomous spines deliver a painful sting like a scorpion. Scorpion from Greek skorpios (σκορπίος), from PIE *sker- (to cut). Scorpaena from Greek skorpaina (σκόρπαινα). Porcus is Latin for pig — possibly from observed algae-eating behavior.",
	},
	{
		id: "nm_0331",
		rationale: "quoted-meaning: quotes dropped from the cited Middle English form comber; text otherwise identical",
		etymology:
			"From Middle English comber (comb + -er), from Indo-European *gemph- (tooth, nail). Applied to this fish due to its distinctive comb-like dorsal fin with 10 spiny rays creating a serrated appearance. Compare scientific name Serranus from Latin serra (saw).",
	},
	{
		id: "nm_0375",
		rationale:
			"quoted-meaning: the quoted glosses to grow / without growth, ungrown / foam lose their quotes; the first and last stay inside their existing parentheses",
		etymology:
			"From Ancient Greek ἀφύη (aphýē), from α- (privative) + φύω (phýō, to grow), meaning without growth, ungrown — referring to small size. PIE *n̥-bʰúH-o-. Ancient folk etymology connected it to ἀφρός (aphrós, foam), as Aristotle believed these fish arose from sea foam.",
	},
	{
		id: "nm_0395",
		rationale:
			"quoted-meaning: the quoted glosses darkness of night / darkness / primordial darkness lose their quotes and stay in their existing parentheses",
		etymology:
			"From Ancient Greek ὀρφός/ὀρφώς (orphós/orphṓs), related to ὄρφνη (órphnē, darkness of night), referring to the fish's dark coloration. From Proto-Hellenic *orkʷʰnā, PIE *h₁régʷos (darkness). Cognate with Ἔρεβος (Érebos, primordial darkness).",
	},
	{
		id: "nm_0419",
		rationale:
			"quoted-meaning: the quoted glosses bivalve/oyster, to gape and to gape, be wide open lose their quotes; quotes also dropped from the cited phrase μια χηβάδα",
		etymology:
			"From Medieval Greek χηβάδα, from Ancient Greek χήμη (chímē, bivalve/oyster), related to χάσκω (cháskō, to gape) from PIE *ǵʰeh₁y- (to gape, be wide open). The prothetic α- developed from the phrase μια χηβάδα. Correct spelling: αχηβάδα.",
	},
];

function main() {
	const db = new Database("public/fish.db");
	db.pragma("foreign_keys = ON");

	console.log("=== TREK-554 etymology notation fixes (22 records) ===\n");

	const select = db.prepare("SELECT etymology FROM names WHERE id = ?");
	// updated_at is stamped on every touched row: pnpm db:validate (a step of
	// pnpm pipeline, the Cloudflare build command) rejects NULL, non-ISO-8601 and
	// future values.
	const update = db.prepare(
		"UPDATE names SET etymology = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now') WHERE id = ?",
	);

	let changed = 0;
	let skipped = 0;

	const apply = db.transaction(() => {
		for (const fix of ETYMOLOGY_FIXES) {
			const before = select.get(fix.id) as { etymology: string } | undefined;
			if (!before) throw new Error(`${fix.id} not found`);
			if (before.etymology === fix.etymology) {
				console.log(`= ${fix.id} already matches, skipped`);
				skipped++;
				continue;
			}
			update.run(fix.etymology, fix.id);
			changed++;
			console.log(`~ ${fix.id}  [${fix.rationale}]`);
			console.log(`  - ${JSON.stringify(before.etymology)}`);
			console.log(`  + ${JSON.stringify(fix.etymology)}`);
		}
	});

	apply();
	db.close();

	console.log(`\n${changed} updated, ${skipped} already compliant.`);
	console.log("Verify: pnpm tsx maintenance/scripts/audit-etymology-format.ts  (expect 56 → 34, all missing-gloss)");
	console.log("Then:   pnpm db:validate");
}

main();
