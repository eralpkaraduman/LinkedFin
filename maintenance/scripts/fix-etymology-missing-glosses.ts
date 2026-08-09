/**
 * Etymology missing-gloss fixes — the 32 sourced records of TREK-554
 *
 * Companion to audit-etymology-format.ts and fix-etymology-format-notation.ts.
 * The notation pass cleared the mechanical categories (quoted-meaning,
 * compound-gloss, missing-translit) and deliberately left the 34
 * `missing-gloss` records alone, because each one needs a meaning that is NOT
 * already in the record — sourcing work, not formatting.
 *
 * This is that sourcing work, applied. The meanings below come from three
 * research passes (Greek/Latin/Romance, Germanic/Nordic, and the residual
 * Turkish/Arabic/Finnish set); they are applied verbatim as researched, not
 * re-derived here.
 *
 * SCOPE: the parenthesised gloss only. No chain is restructured, no step is
 * added or removed, and none of the claim errors the researchers flagged
 * (missing intermediates, doubtful reconstructions) are touched — those are
 * separate sourced work. Each gloss is placed immediately after the source word
 * it glosses, per AGENTS.md "From [language] word (meaning)". Two lines cite two
 * source words on one line and therefore take two glosses (nm_0328, nm_0405);
 * they are glossed in place rather than split into a ↳ chain, since splitting
 * would be a restructure.
 *
 * TWO RECORDS ARE DELIBERATELY EXCLUDED and will still fail the audit
 * afterwards. That is the expected outcome, not an oversight:
 *
 *   nm_0205  "↳ From Proto-Germanic *aburô" — the reconstruction is in neither
 *            Kroonen nor Orel and appears to be unattested; the real etymology
 *            is a compound (agh- sharp + borre bristle). Glossing it would
 *            invent a meaning for a form no dictionary reconstructs.
 *   nm_0361  "From Greek Σαργός via Arabic adaptation" — malformed: proper-noun
 *            capitalisation, no romanization, and "via Arabic adaptation" names
 *            a process rather than a source word. The step needs restructuring
 *            before a gloss can attach to it.
 *
 * Idempotent: re-running skips records that already match.
 *
 * Run: pnpm tsx maintenance/scripts/fix-etymology-missing-glosses.ts
 *      pnpm tsx maintenance/scripts/audit-etymology-format.ts   (expect 34 → 2)
 *      pnpm db:validate
 */
import Database from "better-sqlite3";

interface EtymologyFix {
	id: string;
	/** Why this record changed, and what the applied gloss asserts. */
	rationale: string;
	etymology: string;
}

const ETYMOLOGY_FIXES: EtymologyFix[] = [
	// ------------------------------------------------------------ Greek source words
	{
		id: "nm_0014",
		rationale: "missing-gloss: μπαρμπούνι barboúni glossed red mullet. Chain and Latin barba (beard) step untouched.",
		etymology: ["From Greek μπαρμπούνι barboúni (red mullet)", "↳ From Latin barba (beard)"].join("\n"),
	},
	{
		id: "nm_0016",
		rationale: "missing-gloss: same Greek source word as nm_0014, same gloss red mullet.",
		etymology: ["From Greek μπαρμπούνι barboúni (red mullet)", "↳ From Latin barba (beard)"].join("\n"),
	},
	{
		id: "nm_0053",
		rationale: "missing-gloss: Ancient Greek μέσπιλον méspilon glossed medlar (the fruit, matching the line above).",
		etymology: ["From Greek μούσμουλο moúsmoulo (medlar fruit)", "↳ From Ancient Greek μέσπιλον méspilon (medlar)"].join(
			"\n",
		),
	},
	{
		id: "nm_0065",
		rationale: "missing-gloss: παλαμίδα palamída glossed Atlantic bonito.",
		etymology: [
			"From Greek παλαμίδα palamída (Atlantic bonito)",
			"↳ From Ancient Greek πηλαμύς pēlamýs (young tuna)",
		].join("\n"),
	},
	{
		id: "nm_0078",
		rationale:
			"missing-gloss: σαυρίδιον savridion glossed horse mackerel, scad; literally little lizard — the diminutive sense ties to the σαῦρος saûros (lizard) step already below it.",
		etymology: [
			"From Greek σαυρίδιον savridion (horse mackerel, scad; literally little lizard)",
			"↳ From σαῦρος saûros (lizard)",
		].join("\n"),
	},
	{
		id: "nm_0101",
		rationale: "missing-gloss: Ancient Greek καρίς karís glossed shrimp, prawn.",
		etymology: ["From Greek γαρίδα garída (shrimp)", "↳ From Ancient Greek καρίς karís (shrimp, prawn)"].join("\n"),
	},
	{
		id: "nm_0109",
		rationale: "missing-gloss: παγούρια pagoúria glossed crabs (the plural form as cited).",
		etymology: ["From Greek παγούρια pagoúria (crabs)", "↳ From Ancient Greek πάγουρος págouros (stiff tail)"].join(
			"\n",
		),
	},
	{
		id: "nm_0128",
		rationale:
			"missing-gloss ×2: σαρδέλα sardéla glossed sardine and Latin sardina glossed sardine. The Sardō (Sardinia island) step is untouched.",
		etymology: [
			"From Greek σαρδέλα sardéla (sardine)",
			"↳ From Latin sardina (sardine)",
			"↳ From Sardō (Sardinia island)",
		].join("\n"),
	},

	// ------------------------------------------------------ Latin / Romance source words
	{
		id: "nm_0091",
		rationale:
			"missing-gloss: Latin astacus glossed lobster, identical to the compliant nm_0556 which cites the same word.",
		etymology: [
			"From Latin astacus (lobster)",
			"↳ From Greek ἀστακός astakós (large sea creature/lobster)",
		].join("\n"),
	},
	{
		id: "nm_0104",
		rationale: "missing-gloss: Occitan caramot glossed shrimp, small crustacean.",
		etymology: [
			"From French caramote (large shrimp)",
			"↳ From Occitan caramot (shrimp, small crustacean)",
			"↳ From Latin cammarus (crayfish)",
			"↳ From Greek κάμμαρος kámmaros (lobster)",
		].join("\n"),
	},
	{
		id: "nm_0121",
		rationale:
			"missing-gloss: Italian calamari glossed squids; literally inkpots — the inkpot sense is what links it to the καλαμάριον (little reed) step above.",
		etymology: [
			"From Greek καλαμάριον kalamárion (little reed)",
			"↳ Via Italian calamari (squids; literally inkpots)",
		].join("\n"),
	},
	{
		id: "nm_0131",
		rationale: "missing-gloss: Latin sardina glossed sardine, matching nm_0128 which cites the same word.",
		etymology: "From Latin sardina (sardine)",
	},
	{
		id: "nm_0160",
		rationale: "missing-gloss: Latin perca glossed perch.",
		etymology: ["From Latin perca (perch)", "↳ From Greek πέρκη pérke (spotted)"].join("\n"),
	},
	{
		id: "nm_0167",
		rationale: "missing-gloss: Old French bourbotte glossed burbot, mud-fish — consistent with the bourbe (mud) step.",
		etymology: ["From Old French bourbotte (burbot, mud-fish)", "↳ Related to bourbe (mud)"].join("\n"),
	},
	{
		id: "nm_0230",
		rationale: "missing-gloss: Old French tourbout glossed turbot.",
		etymology: "From Old French tourbout (turbot)",
	},
	{
		id: "nm_0328",
		rationale:
			"missing-gloss: TWO glosses on one line — French bogue (bogue) and Occitan bòga (bogue, Boops boops). Glossed in place; splitting the line into a ↳ chain would be a restructure, which is out of scope here.",
		etymology: "From French bogue (bogue), from Occitan bòga (bogue, Boops boops)",
	},
	{
		id: "nm_0336",
		rationale: "missing-gloss: French picarel glossed picarel, a small Mediterranean fish.",
		etymology: "From French picarel (picarel, a small Mediterranean fish)",
	},
	{
		id: "nm_0362",
		rationale: "missing-gloss: Italian/Spanish anchova glossed anchovy. The dual-language attribution is left as-is.",
		etymology: "From Italian/Spanish anchova (anchovy)",
	},
	{
		id: "nm_0405",
		rationale:
			"missing-gloss: TWO glosses on one line — French langouste (spiny lobster) and Old Provençal langosta (grasshopper; later spiny lobster). Glossed in place, not split; the Latin locusta step below is untouched.",
		etymology: [
			"From French langouste (spiny lobster), from Old Provençal langosta (grasshopper; later spiny lobster)",
			"↳ From Latin locusta (locust, crustacean)",
		].join("\n"),
	},

	// -------------------------------------------------- Germanic / Nordic source words
	{
		id: "nm_0163",
		rationale: "missing-gloss: German Zander glossed pikeperch, matching the Proto-Slavic *sǫdakъ (pikeperch) step.",
		etymology: [
			"From German Zander (pikeperch)",
			"↳ From Middle Low German sandat",
			"↳ Possibly from Slavic, compare Proto-Slavic *sǫdakъ (pikeperch)",
		].join("\n"),
	},
	{
		id: "nm_0177",
		rationale: "missing-gloss: Low German karusse glossed crucian carp.",
		etymology: [
			"From German Karausche (crucian carp)",
			"↳ From Low German karusse (crucian carp)",
			"↳ From Slavic, compare Polish karaś (crucian carp)",
		].join("\n"),
	},
	{
		id: "nm_0186",
		rationale:
			"missing-gloss ×2: Old English bærs glossed perch, Proto-Germanic *barsaz glossed perch, literally the bristly one.",
		etymology: [
			"From Middle English bars (perch-like fish)",
			"↳ From Old English bærs (perch)",
			"↳ From Proto-Germanic *barsaz (perch, literally the bristly one)",
		].join("\n"),
	},
	{
		id: "nm_0208",
		rationale: "missing-gloss: Proto-Germanic *lahsaz glossed salmon.",
		etymology: [
			"From Old Norse lax (salmon)",
			"↳ From Proto-Germanic *lahsaz (salmon)",
			"↳ From PIE *laks- (salmon)",
		].join("\n"),
	},
	{
		id: "nm_0210",
		rationale: "missing-gloss: Proto-Germanic *sīkaz glossed whitefish.",
		etymology: ["From Old Norse síkr (whitefish)", "↳ From Proto-Germanic *sīkaz (whitefish)"].join("\n"),
	},
	{
		id: "nm_0213",
		rationale: "missing-gloss: Proto-Germanic *brahsmō glossed bream.",
		etymology: ["From Old Norse braxn (bream)", "↳ From Proto-Germanic *brahsmō (bream)"].join("\n"),
	},
	{
		id: "nm_0225",
		rationale:
			"missing-gloss: the English source phrase rainbow trout glossed rainbow trout, literally rainbow + trout. The regn/båge gloss line below is untouched.",
		etymology: [
			"Calque from English rainbow trout (rainbow trout, literally rainbow + trout)",
			"regn: rain, båge: arc/bow",
		].join("\n"),
	},
	{
		id: "nm_0281",
		rationale: "missing-gloss: same calque source as nm_0225, same gloss. The viker/forell gloss line is untouched.",
		etymology: [
			"Calque from English rainbow trout (rainbow trout, literally rainbow + trout)",
			"viker: rainbow, forell: trout",
		].join("\n"),
	},
	{
		id: "nm_0420",
		rationale:
			"missing-gloss ×3: Swedish krabba glossed crab (placed beside the word, before the 'via the earlier Finnish form krapu' clause), Old Norse krabbi glossed crab, Proto-Germanic *krabbô glossed crab, literally the scratching one. PIE step and the cognate note are untouched.",
		etymology: [
			"Borrowed from Swedish krabba (crab) via the earlier Finnish form krapu",
			"↳ From Old Norse krabbi (crab)",
			"↳ From Proto-Germanic *krabbô (crab, literally the scratching one)",
			"↳ From Proto-Indo-European *grobʰ- (to crawl, scratch)",
			"Cognate with Estonian krabi, Ingrian/Votic krapu. The initial kr- cluster was reduced to r- in modern Finnish; the older form krapu is now archaic.",
		].join("\n"),
	},
	{
		id: "nm_0425",
		rationale: "missing-gloss: Swedish bläckfisk glossed ink fish, cephalopod. The compound head and gloss line stay.",
		etymology: [
			"Compound: muste + kala",
			"muste: ink, kala: fish",
			"↳ Calque from Swedish bläckfisk (ink fish, cephalopod)",
		].join("\n"),
	},

	// -------------------------------------------------------- other source languages
	{
		id: "nm_0200",
		rationale:
			"missing-gloss: Latin Maius glossed May, placed beside the word so the existing 'named after goddess Maia' remark still trails the line unchanged.",
		etymology: ["From Greek Μάιος Máios (May)", "↳ From Latin Maius (May), named after goddess Maia"].join("\n"),
	},
	{
		id: "nm_0231",
		rationale:
			"missing-gloss: Turkish kalkan glossed shield — the source sense, which the fish name derives from via the turbot's flat shield-like body.",
		etymology: "From Turkish kalkan (shield)",
	},
	{
		id: "nm_0363",
		rationale: "missing-gloss: English mackerel glossed mackerel.",
		etymology: "From English mackerel (mackerel)",
	},
];

function main() {
	const db = new Database("public/fish.db");
	db.pragma("foreign_keys = ON");

	console.log(`=== TREK-554 etymology missing-gloss fixes (${ETYMOLOGY_FIXES.length} records) ===\n`);

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
	console.log(
		"Verify: pnpm tsx maintenance/scripts/audit-etymology-format.ts  (expect 34 → 2: nm_0205 and nm_0361 only)",
	);
	console.log("Then:   pnpm db:validate");
}

main();
