/**
 * Etymology format fixes for the 109 names EPIC-6 never audited (TREK-542)
 *
 * Companion to audit-etymology-format.ts. Every change below is either
 *
 *   (a) pure format — restructuring to the AGENTS.md standard (Compound head +
 *       gloss line, "↳" chains on their own lines, meanings in parentheses,
 *       no quotes, no equals signs), or
 *   (b) a sourced content correction, where the recorded etymology contradicted
 *       the cited reference. Those carry a `source:` note.
 *
 * Nothing here invents an etymology. Records that are malformed and could not
 * be sourced were left alone and reported instead.
 *
 * Run: pnpm tsx maintenance/scripts/fix-etymology-format-since-epic6.ts
 *      pnpm db:validate
 */
import Database from "better-sqlite3";

interface EtymologyFix {
	id: string;
	etymology: string;
	/** Why the change was made; "format" or a cited source. */
	source: string;
}

const ETYMOLOGY_FIXES: EtymologyFix[] = [
	{
		id: "nm_0450",
		source: "format (gloss the Latin step; Wiktionary: Latin scomber = mackerel)",
		etymology: [
			"From Greek σκουμπρί skoumbrí (mackerel)",
			"↳ From Latin scomber (mackerel)",
			"↳ From Greek σκόμβρος skómbros (mackerel)",
		].join("\n"),
	},
	{
		id: "nm_0453",
		source: "format (quoted gloss removed)",
		etymology: [
			"Compound: monk + fish",
			"monk: resembles monk's hood, fish: generic suffix",
			"↳ Origin of the monk reference uncertain",
		].join("\n"),
	},
	{
		id: "nm_0454",
		source: "format (gloss the Old Norse step; Wiktionary: humarr = lobster)",
		etymology: ["From Swedish hummer (lobster)", "↳ From Old Norse humarr (lobster)"].join("\n"),
	},
	{
		id: "nm_0457",
		source: "format (gloss the Proto-Germanic step; Wiktionary: *krabbô = crab)",
		etymology: ["From Old Norse krabbi (crab)", "↳ From Proto-Germanic *krabbô (crab)"].join("\n"),
	},
	{
		id: "nm_0466",
		source: "format (literal translation in quotes removed per AGENTS.md)",
		etymology: [
			"From Italian capo (head) + -one (augmentative suffix)",
			"Refers to the gurnard's large head",
		].join("\n"),
	},
	{
		id: "nm_0471",
		source: "format (compound part kungs- was not glossed)",
		etymology: [
			"Compound: större + kungs + fisk",
			"större: larger, kungs: king's (genitive of kung), fisk: fish",
		].join("\n"),
	},
	{
		id: "nm_0494",
		source: "format (gloss line now repeats the Greek head words with their romanization)",
		etymology: [
			"Compound: πριόνι + ψάρι",
			"πριόνι prióni: saw, ψάρι psári: fish",
			"↳ πριόνι from Ancient Greek πρίων príōn (saw)",
		].join("\n"),
	},
	{
		id: "nm_0495",
		source: "format (gloss Middle Dutch hārinc; Wiktionary)",
		etymology: [
			"From Middle Dutch hārinc (herring)",
			"↳ From Proto-Germanic *hēringaz (herring), possibly related to *hēra- (gray, silvery), describing the fish's appearance",
		].join("\n"),
	},
	{
		id: "nm_0497",
		source: "format (gloss Middle Dutch hārinc; Wiktionary)",
		etymology: [
			"From Middle Dutch hārinc (herring)",
			"↳ From Proto-Germanic *hēringaz (herring), possibly related to *hēra- (gray, silvery), describing the fish's shimmering appearance",
		].join("\n"),
	},
	{
		id: "nm_0498",
		source: "format (gloss Old French harenc; Wiktionary)",
		etymology: [
			"From Old French harenc (herring)",
			"↳ From Frankish *hāring (herring), from Proto-Germanic *hēringaz (herring), possibly related to *hēra- (gray, silvery)",
		].join("\n"),
	},
	{
		id: "nm_0499",
		source: "format (gloss the German steps; Wiktionary)",
		etymology: [
			"From Middle High German hærinc (herring)",
			"↳ From Old High German hāring (herring), from Proto-Germanic *hēringaz (herring), possibly related to *hēra- (gray, silvery)",
		].join("\n"),
	},
	{
		id: "nm_0500",
		source: "format (gloss Old Norse síld; Wiktionary)",
		etymology: [
			"From Old Norse síld (herring)",
			"↳ From Proto-Germanic *sīlą (herring), of uncertain further etymology",
		].join("\n"),
	},
	{
		id: "nm_0501",
		source: "format (gloss Old Norse síld; Wiktionary)",
		etymology: [
			"From Old Norse síld (herring)",
			"↳ From Proto-Germanic *sīlą (herring), of uncertain further etymology",
		].join("\n"),
	},
	{
		id: "nm_0502",
		source: "format (gloss Old Norse síld; Wiktionary)",
		etymology: [
			"From Old Norse síld (herring)",
			"↳ From Proto-Germanic *sīlą (herring), of uncertain further etymology",
		].join("\n"),
	},
	{
		id: "nm_0503",
		source: "format (inline chain split onto ↳ lines, steps glossed; Wiktionary)",
		etymology: [
			"From Greek ρέγγα rénga (herring)",
			"↳ From Medieval Latin arenga/harenga (herring)",
			"↳ From Proto-Germanic *hēringaz (herring)",
		].join("\n"),
	},
	{
		id: "nm_0504",
		source: "format (gloss Medieval Latin arenga/harenga; Wiktionary)",
		etymology: [
			"From Medieval Latin arenga/harenga (herring)",
			"↳ From Proto-Germanic *hēringaz (herring), possibly related to *hēra- (gray, silvery)",
		].join("\n"),
	},
	{
		id: "nm_0525",
		source:
			"CONTENT: en.wiktionary 'sardien' — Dutch inherited it from Middle Dutch sardeyne < Latin sardina; the recorded French source was wrong",
		etymology: [
			"From Middle Dutch sardeyne (sardine)",
			"↳ From Latin sardina (sardine)",
			"↳ From Greek Σαρδίνη Sardínē (Sardinia), where the fish was once abundant",
		].join("\n"),
	},
	{
		id: "nm_0526",
		source: "format (gloss the Latin step; en.wiktionary: French sardine inherited from Latin sardīna)",
		etymology: [
			"From Latin sardina (sardine)",
			"↳ From Greek Σαρδίνη Sardínē (Sardinia), where large shoals were historically found",
		].join("\n"),
	},
	{
		id: "nm_0527",
		source:
			"CONTENT: de.wiktionary 'Sardine' — entlehnt aus italienisch sardina, Verkleinerungsform von sarda; not via French",
		etymology: [
			"From Italian sardina (sardine), diminutive of sarda (a Mediterranean fish)",
			"↳ From Latin sardina (sardine)",
			"↳ From Greek Σαρδίνη Sardínē (Sardinia), referring to the island where the fish was plentiful",
		].join("\n"),
	},
	{
		id: "nm_0528",
		source:
			"CONTENT: Bokmålsordboka (ordbokene.no/nob/bm/50199) gives 'fra latin', same origin as sardell; not French",
		etymology: [
			"From Latin sardina (sardine)",
			"↳ From Greek Σαρδίνη Sardínē (Sardinia), where the fish was once abundant",
		].join("\n"),
	},
	{
		id: "nm_0529",
		source: "CONTENT: sv.wiktionary and en.wiktionary 'sardin' — borrowed from Italian sardina, not French",
		etymology: [
			"From Italian sardina (sardine)",
			"↳ From Latin sarda (a Mediterranean fish)",
			"↳ From Greek Σαρδίνη Sardínē (Sardinia), where the fish was once abundant",
		].join("\n"),
	},
	{
		id: "nm_0530",
		source: "format (gloss Middle Dutch sprot; Wiktionary)",
		etymology: [
			"From Middle Dutch sprot (sprat)",
			"↳ From Proto-Germanic *sprut- (sprout), referring to the small size of the fish",
		].join("\n"),
	},
	{
		id: "nm_0531",
		source: "format (gloss the English source; fr.wiktionary: de l'anglais sprat)",
		etymology: [
			"Borrowed from English sprat (the fish Sprattus sprattus)",
			"↳ From Old English sprott (small herring), from Proto-Germanic *sprut- (sprout), describing the fish's small size",
		].join("\n"),
	},
	{
		id: "nm_0532",
		source: "format (gloss Low German Sprotte; Wiktionary)",
		etymology: [
			"From Low German Sprotte (sprat)",
			"↳ From Proto-Germanic *sprut- (sprout), referring to the small, slender fish",
		].join("\n"),
	},
	{
		id: "nm_0533",
		source:
			"CONTENT: en.wiktionary 'brisling' — from Low German bretling, from bret (broad); the recorded 'from Norwegian brisling' was circular and the Old Norse brisa link unsupported",
		etymology: [
			"From Low German bretling (broad one)",
			"↳ From bret (broad), from Middle Low German *brêd (broad)",
			"↳ From Old Saxon brēd (broad)",
		].join("\n"),
	},
	{
		id: "nm_0534",
		source: "format (compound parts moved to the gloss line)",
		etymology: [
			"Compound: vass + buk",
			"vass: sharp, buk: belly",
			"Refers to the sprat's sharp-keeled belly",
		].join("\n"),
	},
	{
		id: "nm_0535",
		source: "format (gloss the Spanish and Portuguese steps; Wiktionary)",
		etymology: [
			"From Spanish anchoa (anchovy), via Portuguese anchova (anchovy)",
			"↳ Ultimately from Basque antzua (dried fish) or Latin apiuva (small fish)",
		].join("\n"),
	},
	{
		id: "nm_0536",
		source: "format (gloss the Ligurian and Vulgar Latin steps; Wiktionnaire/Wiktionary)",
		etymology: [
			"Inherited from Old French, from Old Occitan anchoia (anchovy)",
			"↳ From Ligurian anciôa (anchovy)",
			"↳ From Vulgar Latin *apiuva (small fish)",
			"↳ From Latin aphyē (small fry)",
			"↳ From Ancient Greek ἀφύη aphýē (anchovy, small fish)",
			"An older alternative theory derived anchois from Basque antxu/anchu (dried fish), but the phonetic evidence is irregular and the Ligurian/Romance path is the primary documented one (Wiktionary)",
		].join("\n"),
	},
	{
		id: "nm_0537",
		source: "format (gloss the Latin step; Wiktionary)",
		etymology: [
			"From Italian sardella (small sardine), diminutive of sarda (sardine)",
			"↳ From Latin sardina (sardine), reflecting the anchovy's resemblance to a small sardine",
		].join("\n"),
	},
	{
		id: "nm_0538",
		source:
			"CONTENT: en.wiktionary 'ansjos' — via Dutch ansjovis, from Spanish plural anchovas, from Ligurian anciôa; the German alternative and the Basque origin were not supported",
		etymology: [
			"From Dutch ansjovis (anchovy)",
			"↳ From Spanish anchovas (anchovies), from Ligurian anciôa (anchovy)",
			"↳ Ultimately from Ancient Greek ἀφύη aphýē (anchovy, small fish)",
		].join("\n"),
	},
	{
		id: "nm_0539",
		source: "format (gloss the Latin step; en.wiktionary: Swedish sardell borrowed from Italian sardella)",
		etymology: [
			"From Italian sardella (small sardine), diminutive of sarda (sardine)",
			"↳ From Latin sardina (sardine)",
			"In Sweden sardell traditionally refers to spiced sprat, but also denotes the true anchovy",
		].join("\n"),
	},
	{
		id: "nm_0546",
		source: "format (gloss the Latin source word; Wiktionary: Latin orca = a kind of whale)",
		etymology: [
			"From Latin orca (a kind of whale, large sea creature)",
			"↳ Cognate with Ancient Greek ὄρυξ óryks (pointed tool, mythical sea creature)",
			"Modern Greek name for tuna, parallel to Τόνος (from Latin thunnus)",
		].join("\n"),
	},
	{
		id: "nm_0547",
		source: "format (gloss the Latin step; Wiktionary: Latin thunnus = tunny)",
		etymology: [
			"Compound: ton + balık",
			"ton: from French thon (tuna), balık: fish",
			"↳ thon from Latin thunnus (tuna)",
			"↳ From Ancient Greek θύννος thýnnos (tuna)",
		].join("\n"),
	},
	{
		id: "nm_0548",
		source: "format (quoted literal translation removed, gloss line normalized)",
		etymology: [
			"Compound: ὀκτώ + πούς",
			"ὀκτώ oktṓ: eight, πούς poús: foot",
			"Variant form ὀκτώπους oktṓpous, less common in classical texts than πολύπους but the ancestor of Modern Greek χταπόδι via the Byzantine diminutive ὀκταπόδιον",
		].join("\n"),
	},
	{
		id: "nm_0549",
		source: "format (quoted literal translation removed; Greek source word spelled out)",
		etymology: [
			"Compound: sarı + kanat + istavrit",
			"sarı: yellow, kanat: fin/wing, istavrit: horse mackerel, from Greek σαυρίδι savrídi (horse mackerel)",
		].join("\n"),
	},
	{
		id: "nm_0551",
		source: "format (double-quoted glosses replaced with parentheses, chain split onto a ↳ line)",
		etymology: [
			"From Middle English chubbe (chub, the river fish)",
			"↳ Origin uncertain, probably from a base meaning lump, block (compare Old Norse kubbr, block or stump), in reference to the fish's thick, chunky body",
		].join("\n"),
	},
	{
		id: "nm_0553",
		source: "format (double-quoted gloss replaced with parentheses, recast as a compound)",
		etymology: [
			"Compound: Arctic + char",
			"Arctic: of the far north, char: fish name of uncertain origin",
			"↳ char perhaps from Celtic (compare Irish ceara, fiery red, in reference to the reddish belly) or from Middle Low German schar (flounder)",
		].join("\n"),
	},
	{
		id: "nm_0555",
		source: "format (compound parts moved to their own gloss line)",
		etymology: [
			"Compound: Saimaa + nieriä",
			"Saimaa: Lake Saimaa (Finland), nieriä: Arctic char (of unknown origin)",
			"Names the landlocked Arctic char population endemic to the Saimaa lake system",
		].join("\n"),
	},
];

/**
 * Transliterations must be plain ASCII for Latin-script languages — that is the
 * convention across all 403 records EPIC-6 audited, and AGENTS.md spells out the
 * folding rules for Turkish and the Nordic languages. These four were the only
 * Latin-script names in the whole database still carrying diacritics.
 */
const TRANSLITERATION_FIXES: { id: string; transliteration: string; source: string }[] = [
	{ id: "nm_0480", transliteration: "Muren baligi", source: "Turkish folding ü→u, ğ→g, ı→i" },
	{ id: "nm_0483", transliteration: "Dikenli istakoz", source: "Turkish folding ı→i" },
	{ id: "nm_0485", transliteration: "Rodfisk", source: "Swedish folding ö→o" },
	{ id: "nm_0505", transliteration: "Sledz", source: "Polish folding ś→s, dź→dz" },
];

/**
 * The Italian/Venetian batch used an ASCII apostrophe for IPA primary stress.
 * Every other record in the database uses U+02C8. Purely typographic.
 */
function fixItalianStressMarks(db: Database.Database): { id: string; before: string; after: string }[] {
	const rows = db
		.prepare("SELECT id, phonetic FROM names WHERE phonetic LIKE '%''%'")
		.all() as { id: string; phonetic: string }[];
	const update = db.prepare("UPDATE names SET phonetic = ? WHERE id = ?");
	const changed: { id: string; before: string; after: string }[] = [];
	for (const row of rows) {
		const after = row.phonetic.replace(/'/g, "ˈ");
		update.run(after, row.id);
		changed.push({ id: row.id, before: row.phonetic, after });
	}
	return changed;
}

function main() {
	const db = new Database("public/fish.db");
	db.pragma("foreign_keys = ON");

	console.log("=== TREK-542 etymology format fixes ===\n");

	const selectName = db.prepare("SELECT etymology, transliteration FROM names WHERE id = ?");
	const updateEtymology = db.prepare("UPDATE names SET etymology = ? WHERE id = ?");
	const updateTransliteration = db.prepare("UPDATE names SET transliteration = ? WHERE id = ?");

	const apply = db.transaction(() => {
		for (const fix of ETYMOLOGY_FIXES) {
			const before = selectName.get(fix.id) as { etymology: string } | undefined;
			if (!before) throw new Error(`${fix.id} not found`);
			if (before.etymology === fix.etymology) {
				console.log(`= ${fix.id} already matches, skipped`);
				continue;
			}
			updateEtymology.run(fix.etymology, fix.id);
			console.log(`~ ${fix.id}  [${fix.source}]`);
			console.log(`  - ${JSON.stringify(before.etymology)}`);
			console.log(`  + ${JSON.stringify(fix.etymology)}`);
		}

		for (const fix of TRANSLITERATION_FIXES) {
			const before = selectName.get(fix.id) as { transliteration: string } | undefined;
			if (!before) throw new Error(`${fix.id} not found`);
			if (before.transliteration === fix.transliteration) {
				console.log(`= ${fix.id} transliteration already matches, skipped`);
				continue;
			}
			updateTransliteration.run(fix.transliteration, fix.id);
			console.log(`~ ${fix.id} transliteration [${fix.source}]`);
			console.log(`  - ${before.transliteration}`);
			console.log(`  + ${fix.transliteration}`);
		}

		for (const change of fixItalianStressMarks(db)) {
			console.log(`~ ${change.id} phonetic stress mark: ${change.before} → ${change.after}`);
		}
	});

	apply();
	db.close();
	console.log("\nDone. Run: pnpm db:validate");
}

main();
