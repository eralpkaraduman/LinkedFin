/**
 * TREK-569 — targeted accuracy pass over the 102 Greek records (grc + ell).
 *
 * The failure mode being hunted is *unhedged assertion of a contested
 * derivation*: Greek fish names are disproportionately Pre-Greek substrate
 * words that the literature marks unknown or disputed, and this corpus states
 * one hypothesis as settled fact. "Origin uncertain, probably Pre-Greek
 * (Beekes)" is the correct etymology where that is what the sources say.
 *
 * Sources actually reached (lsj.gr 403s, Perseus 503s, Kriaras blocked):
 *   - en.wiktionary Ancient Greek entries, fetched as raw wikitext
 *     (?action=raw) so the Beekes / Furnée / Strömberg citations are read
 *     verbatim rather than through a summariser.
 *   - el.wiktionary for Modern Greek, which cites ΛΚΝ (Triantafyllides),
 *     Babiniotis and Andriotis inline.
 *   - el.wikipedia for μουγγρί, where neither Wiktionary has an entry.
 * The per-record rationale below names the one that settles it.
 *
 * Idempotent: a record whose etymology already matches the target text is
 * skipped, so `updated_at` is not re-stamped on a no-op re-run.
 *
 * Usage: pnpm tsx maintenance/scripts/fix-greek-etymologies-trek569.ts
 */
import Database from "better-sqlite3";

interface Fix {
	id: string;
	/** Why the old text is wrong or thin, and which source settles it. */
	why: string;
	etymology: string;
	/** Headword corrections travel with their phonetic/transliteration. */
	name?: string;
	transliteration?: string;
	phonetic?: string;
}

const FIXES: Fix[] = [
	// ---------------------------------------------------------------- WRONG
	{
		id: "nm_0088",
		why:
			"Asserted the bramble link. en.wiktionary βάτος has the skate as Etymology 2 — " +
			"a separate headword with no etymology given — while the bramble is Etymology 1, " +
			"a Mediterranean wanderwort. The Modern Greek section derives the fish sense from " +
			"βατίς, citing Dimitrakos. Same shape as the σαργάνη error.",
		etymology: [
			"From Greek βάτος vátos (skate), a masculine noun distinct from the feminine βάτος vátos (bramble)",
			"↳ The fish sense continues Ancient Greek βάτος bátos (a kind of skate), a separate headword whose origin is not established",
			"↳ Modern Greek dictionaries trace the fish name to βατίς vatís (skate); the bramble word is a Mediterranean wanderwort and no connection between the two is demonstrated",
		].join("\n"),
	},
	{
		id: "nm_0382",
		why:
			"Derived σηπία from σήπω flat. en.wiktionary σηπία, citing Beekes: the connection " +
			"is semantically possible but formally problematic, and he takes the word as Pre-Greek.",
		etymology: [
			"Origin uncertain, probably Pre-Greek substrate (Beekes)",
			"↳ The traditional connection with σήπω sḗpō (to make rotten), by way of the ink, is semantically possible but formally problematic",
			"↳ Borrowed into Latin as sepia (cuttlefish, ink), whence the genus name",
		].join("\n"),
	},
	{
		id: "nm_0124",
		why: "Propagates nm_0382: the Modern Greek record inherited the same unhedged σηπία chain.",
		etymology: [
			"From Greek σουπιά soupiá (cuttlefish)",
			"↳ From Ancient Greek σηπία sēpía (cuttlefish), origin uncertain",
			"↳ Probably Pre-Greek substrate; the traditional link with σήπω sḗpō (to make rotten) is formally problematic (Beekes)",
		].join("\n"),
	},
	{
		id: "nm_0384",
		why:
			"Said ῥίνη is from ῥίς (nose), flat-nosed. en.wiktionary ῥίνη glosses it first as " +
			"file/rasp — the shark is named for its skin, used for polishing wood and marble — " +
			"marks the etymology unknown, and explicitly warns not to confuse it with ῥίς or ῥινός.",
		etymology: [
			"From Ancient Greek ῥίνη rhínē (file, rasp), the angel shark being named for its rough skin, which was used for polishing wood and marble",
			"↳ Origin unknown; despite the resemblance it is not derived from ῥίς rhís (nose) or ῥινός rhinós (hide)",
		].join("\n"),
	},
	{
		id: "nm_0312",
		why:
			"Cited a non-existent Ancient Greek headword γόπα. en.wiktionary γόπα: from Medieval " +
			"Greek γῶπα, from Byzantine βῶψ / βόωψ, from Ancient Greek βῶξ, contracted from βόαξ.",
		etymology: [
			"From Medieval Greek γῶπα gôpa (bogue)",
			"↳ From Byzantine Greek βῶψ bôps (bogue), also βόωψ bóōps",
			"↳ From Ancient Greek βῶξ bôx (bogue), contracted from βόαξ bóax",
		].join("\n"),
	},
	{
		id: "nm_0322",
		why:
			"Called the name a Greek onomatopoeia from μουγκρίζω (to bellow). el.wikipedia Μουγγρί: " +
			"it is a corruption of the ancient name, from Hellenistic γογγρίον, diminutive of " +
			"γόγγρος, with initial g- becoming m-. The headword was also misaccented: the fish is " +
			"the oxytone μουγγρί (from the diminutive -ίν), not μούγκρι, which is what invited the " +
			"bellowing etymology in the first place.",
		name: "Μουγγρί",
		transliteration: "Moungrí",
		phonetic: "/muˈŋɡri/",
		etymology: [
			"From Medieval Greek μουγγρίν moungrín (conger eel)",
			"↳ From Hellenistic Greek γογγρίον gongríon (small conger), diminutive of Ancient Greek γόγγρος góngros (conger eel), with the initial g- becoming m-",
			"↳ γόγγρος góngros is itself of uncertain origin, possibly onomatopoeic",
		].join("\n"),
	},
	{
		id: "nm_0321",
		why:
			"Cited an Ancient Greek headword ῥόφος that no lexicon carries. el.wiktionary ροφός " +
			"derives it from ancient ὀρφώς; en.wiktionary ὀρφώς marks the etymology unknown.",
		etymology: [
			"From Ancient Greek ὀρφώς orphṓs (dusky grouper), also ὀρφός orphós",
			"↳ Origin unknown; often compared with ὄρφνη órphnē (darkness of night) for the fish's dark colour, but the connection is not established",
		].join("\n"),
	},
	{
		id: "nm_0395",
		why:
			"Propagates nm_0321 from the other side: stated the ὄρφνη derivation as fact and built a " +
			"Proto-Hellenic and PIE chain on it. en.wiktionary ὀρφώς: origin unknown, ὄρφνη only a " +
			"comparison, and Bechtel's ὀρφανός proposal lacks semantic justification.",
		etymology: [
			"Origin unknown",
			"↳ Often compared with ὄρφνη órphnē (darkness of night), for the fish's dark colouring, but the connection is not established",
			"↳ Bechtel's link to ὀρφανός orphanós (orphan), alluding to its solitary habits, lacks semantic justification",
			"↳ Modern Greek ροφός rofós descends from it",
		].join("\n"),
	},
	{
		id: "nm_0049",
		why:
			"Derived λυθρίνι from λύθρον (gore). el.wiktionary λυθρίνι: from an unattested " +
			"*ἐρυθρίνιον, from ἐρυθρῖνος, from ἐρυθρός (red) — which is also the species epithet " +
			"of Pagellus erythrinus.",
		etymology: [
			"From an unattested Medieval Greek *ἐρυθρίνιον erythrínion, diminutive of Ancient Greek ἐρυθρῖνος erythrînos (a red sea fish)",
			"↳ From ἐρυθρός erythrós (red)",
		].join("\n"),
	},
	{
		id: "nm_0037",
		why:
			"Derived σφυρίδα straight from σφύρα (hammer) for the head shape. el.wiktionary σφυρίδα, " +
			"citing ΛΚΝ: from Koine σφύραινα with the ending remodelled to -ίδα after συναγρίδα.",
		etymology: [
			"From Koine Greek σφύραινα sfýraina (barracuda), the ending remodelled to -ίδα -ída after συναγρίδα synagrída (dentex)",
			"↳ σφύραινα sfýraina is traditionally derived from σφῦρα sfýra (hammer), for the fish's shape",
		].join("\n"),
	},
	{
		id: "nm_0320",
		why:
			"Guessed at a headword μάρις. el.wiktionary μαρίδα, citing ΛΚΝ: from σμαρίς through the " +
			"accusative σμαρίδα, the s- lost by resegmentation after the article. en.wiktionary " +
			"σμαρίς: Pre-Greek per Furnée, compared with σπάρος.",
		etymology: [
			"From Ancient Greek σμαρίς smarís (picarel), through the accusative σμαρίδα smarída, the initial s- lost by resegmentation after the article",
			"↳ Origin uncertain, probably Pre-Greek substrate; Furnée compares σπάρος spáros (annular seabream)",
		].join("\n"),
	},
	{
		id: "nm_0135",
		why:
			"Analysed the name as a folk compound of μύλο (mill) plus a non-word κόπι (cutter). " +
			"el.wiktionary μυλοκόπι: from Koine μυλοκόπιον / μυλοκόπος, from Ancient Greek μύλλος.",
		etymology: [
			"From Koine Greek μυλοκόπιον mylokópion, also μυλοκόπος mylokópos (a kind of fish)",
			"↳ From Ancient Greek μύλλος mýllos (a kind of fish)",
		].join("\n"),
	},
	{
		id: "nm_0327",
		why:
			"Glossed Italian capone as big head. el.wiktionary καπόνι, citing ΛΚΝ and Andriotis: the " +
			"fish name is from Venetian capon or Italian cappone, from Latin capo — a capon, a " +
			"castrated cockerel, not a head.",
		etymology: [
			"From Venetian capon (capon, castrated cockerel), or from Italian cappone (capon)",
			"↳ From Latin capo (capon)",
		].join("\n"),
	},
	{
		id: "nm_0546",
		why:
			"Reversed the borrowing: had the Greek word coming from Latin orca. en.wiktionary ὄρκυς " +
			"(variants ὄρκυνος, ὀρκύαλος): an unexplained loanword, probably Pre-Greek — and Latin " +
			"orcynus is the borrowing from Greek, not the source.",
		etymology: [
			"From Ancient Greek ὄρκυνος órkynos (a large kind of tunny), a variant of ὄρκυς órkys",
			"↳ An unexplained loanword, probably Pre-Greek substrate (Beekes)",
			"↳ Latin orcynus (large tunny) was borrowed from the Greek, not the reverse; it is a different word from Latin orca (a kind of whale)",
		].join("\n"),
	},
	{
		id: "nm_0376",
		why:
			"Derived πηλαμύς from πηλός (mud). en.wiktionary πηλαμύς cites Beekes EDG vol. 2 p. 1185: " +
			"likely from a Pre-Greek substrate.",
		etymology: [
			"Origin uncertain, likely Pre-Greek substrate (Beekes)",
			"↳ The traditional connection with πηλός pēlós (mud), from the fish being found in muddy water, is not supported",
			"↳ Borrowed into Latin as pelamys (young tunny), whence Italian palamita and Modern Greek παλαμίδα palamída",
		].join("\n"),
	},
	{
		id: "nm_0393",
		why:
			"Asserted the μαίνομαι derivation. en.wiktionary μαίνη (of which μαινίς is the " +
			"derivative): no etymology; Strömberg only hesitatingly attempts μαίνομαι, and the " +
			"Russian/Lithuanian/Sanskrit comparanda are extremely doubtful.",
		etymology: [
			"Origin unknown",
			"↳ Derivative of μαίνη maínē (blotched picarel), which has no accepted etymology",
			"↳ Strömberg's hesitant connection with μαίνομαι maínomai (to rage), reading it as the wild raging fish, is not established; comparison with Russian мень men (burbot) and Sanskrit मीन mīna (fish) is extremely doubtful",
		].join("\n"),
	},
	{
		id: "nm_0386",
		why:
			"Conflated two headwords, the same error as βάτος. en.wiktionary φάγρος has the fish as " +
			"Etymology 1 — Pre-Greek per Beekes, on the evidence of the variants πάγρος and " +
			"φαγρώριος — and the Cretan whetstone word as a separate Etymology 2.",
		etymology: [
			"Origin uncertain, probably Pre-Greek substrate (Beekes), on the evidence of the variants πάγρος págros and φαγρώριος phagrṓrios",
			"↳ A homonymous Cretan φάγρος phágros (whetstone), possibly from PIE *bʰh₂g-ro- (sharpening), is a separate headword; no connection between the two is established",
		].join("\n"),
	},
	{
		id: "nm_0191",
		why: "Propagates nm_0386: the Modern Greek record repeated the whetstone conflation verbatim.",
		etymology: [
			"From Ancient Greek φάγρος phágros (red porgy)",
			"↳ Origin uncertain, probably Pre-Greek substrate (Beekes), on the evidence of the variants πάγρος págros and φαγρώριος phagrṓrios",
			"↳ A homonymous Cretan φάγρος phágros (whetstone) is a separate headword; no connection between the two is established",
		].join("\n"),
	},
	{
		id: "nm_0324",
		why:
			"Took Modern τόνος straight from θύννος and derived that from θύνω. el.wiktionary τόνος, " +
			"citing ΛΚΝ: the fish sense is from Italian tonno via Late Latin tunnus — a reborrowing " +
			"(αντιδάνειο). en.wiktionary θύννος now gives a Phoenician source instead of θύνω, so the " +
			"deeper step is contested either way.",
		etymology: [
			"From Italian tonno (tuna)",
			"↳ From Late Latin tunnus (tuna)",
			"↳ From Ancient Greek θύννος thýnnos (tuna), making the modern word a reborrowing into Greek",
			"↳ θύννος thýnnos is of disputed origin: traditionally linked to θύνω thýnō (to rush, dart), though a Phoenician source has also been proposed",
		].join("\n"),
	},
	{
		id: "nm_0368",
		why:
			"Derived the Ancient Greek headword from itself and then from θύνω. en.wiktionary θύννος " +
			"gives a Phoenician borrowing (compare Ugaritic tnn, Hebrew tannīn) and does not mention " +
			"θύνω at all; the traditional θύνω link survives elsewhere, so the honest statement is " +
			"that the origin is disputed.",
		etymology: [
			"Origin disputed",
			"↳ Traditionally derived from θύνω thýnō (to rush, dart), for the fish's speed",
			"↳ A Phoenician source has also been proposed, compared with Hebrew תַּנִּין tannīn (sea monster, large water animal) and attested in Punic as the Island of Tunnies",
			"↳ Borrowed into Latin as thunnus (tuna), whence Italian tonno and Modern Greek τόνος tónos",
		].join("\n"),
	},
	{
		id: "nm_0313",
		why:
			"Derived γύλος from γῦρος (round). No lexicon supports it: el.wiktionary γύλος marks the " +
			"etymology missing and gives ἴουλος / ἰουλίς as the Ancient Greek equivalents. Replacing " +
			"an unsourced assertion with an honest blank rather than inventing a root.",
		etymology: [
			"Origin uncertain; no derivation is established",
			"↳ The corresponding Ancient Greek names for the fish are ἴουλος íoulos and ἰουλίς ioulís",
		].join("\n"),
	},
	{
		id: "nm_0416",
		why:
			"Hedged towards ὀστέον, which Beekes rejects, and skipped the Medieval step. " +
			"el.wiktionary στρείδι, citing Babiniotis and ΛΚΝ: from Medieval ὀστρείδιον with loss of " +
			"the initial o-. en.wiktionary ὄστρεον: Beekes rejects the ὀστέον link and takes it as Pre-Greek.",
		etymology: [
			"From Medieval Greek ὀστρείδιον ostreídion (small oyster), the initial o- lost and the ending adapted",
			"↳ Diminutive of Ancient Greek ὄστρεον óstreon (oyster, bivalve)",
			"↳ Origin uncertain; the traditional link with ὀστέον ostéon (bone) is rejected by Beekes, who takes the word as Pre-Greek substrate",
		].join("\n"),
	},

	// ------------------------------------------------------------ IMPRECISE
	// Truncated chains and vague glosses, each closed by a source rather than a guess.
	{
		id: "nm_0015",
		why:
			"Jumped from a Modern Greek fish name to Latin barba with nothing in between. " +
			"el.wiktionary μπαρμπούνι: Venetian barbon, Italian barba, Latin barba, PIE *bʰardʰeh₂-.",
		etymology: [
			"From Venetian barbon (red mullet), for the pair of barbels under the chin",
			"↳ From Italian barba (beard)",
			"↳ From Latin barba (beard)",
			"↳ From Proto-Indo-European *bʰardʰeh₂- (beard)",
		].join("\n"),
	},
	{
		id: "nm_0119",
		why:
			"Went straight from squid to κάλαμος, dropping the step that explains the sense. " +
			"en.wiktionary καλαμάρι: Medieval καλαμάριον, from Latin calamarius, from κάλαμος — " +
			"the archaic Greek sense of the word is still inkwell.",
		etymology: [
			"From Medieval Greek καλαμάριον kalamárion (inkwell)",
			"↳ From Latin calamarius (of a reed pen, pen case)",
			"↳ From Ancient Greek κάλαμος kálamos (reed, pen)",
			"↳ The squid is named for its ink; the word still means inkwell in archaic Greek usage",
		].join("\n"),
	},
	{
		id: "nm_0053",
		why: "Missing the Medieval step. el.wiktionary μούσμουλο, citing ΛΚΝ: μούσπουλον, earlier μέσπουλον, from μέσπιλον.",
		etymology: [
			"From Greek μούσμουλο moúsmoulo (medlar fruit)",
			"↳ From Medieval Greek μούσπουλον moúspoulon (medlar), earlier μέσπουλον méspoulon",
			"↳ From Ancient Greek μέσπιλον méspilon (medlar)",
		].join("\n"),
	},
	{
		id: "nm_0504",
		why:
			"Had Greek borrowing directly from Medieval Latin. el.wiktionary ρέγκα: from Venetian " +
			"renga, from Medieval Latin haringus, from Frankish *hāring, from Proto-Germanic *hēringaz.",
		etymology: [
			"From Venetian renga (herring)",
			"↳ From Medieval Latin haringus (herring)",
			"↳ From Frankish *hāring (herring)",
			"↳ From Proto-Germanic *hēringaz (herring)",
		].join("\n"),
	},
	{
		id: "nm_0129",
		why:
			"Skipped Italian and missed that this is a reborrowing. el.wiktionary σαρδέλα: Italian " +
			"sardella, diminutive of sarda, from Latin sardina, from Ancient Greek σαρδίνη — " +
			"explicitly marked αντιδάνειο.",
		etymology: [
			"From Italian sardella (small sardine), diminutive of sarda (sardine)",
			"↳ From Latin sardina (sardine)",
			"↳ From Ancient Greek σαρδίνη sardínē (sardine), making the modern word a reborrowing into Greek",
			"↳ From Σαρδώ Sardṓ (Sardinia), the island off which the fish was caught",
		].join("\n"),
	},
	{
		id: "nm_0317",
		why:
			"Guessed onomatopoeia without naming the ancient word. en.wiktionary μορμύρος: Strömberg " +
			"derives it from μορμύρω, Beekes does not dismiss a Pre-Greek origin, and the μύρω link " +
			"is unconvincing.",
		etymology: [
			"From Ancient Greek μορμύρος mormýros (striped seabream)",
			"↳ Origin uncertain; Strömberg derives it from μορμύρω mormýrō (to roar, to boil), reading the fish as the bubble-blower, while Beekes does not dismiss a Pre-Greek substrate origin",
			"↳ The connection with μύρω mýrō (to flow, trickle) is not convincing",
		].join("\n"),
	},
	{
		id: "nm_0075",
		why:
			"Restated the headword and stopped. en.wiktionary σπάρος cites Beekes EDG pp. 1376-1377: " +
			"unknown, perhaps Pre-Greek and related to σμαρίς.",
		etymology: [
			"From Ancient Greek σπάρος spáros (annular seabream)",
			"↳ Origin unknown; perhaps Pre-Greek substrate and related to σμαρίς smarís (picarel), per Beekes",
		].join("\n"),
	},
	{
		id: "nm_0326",
		why: "Restated the headword. en.wiktionary ἀθερίνη: from ἀθήρ (awn, barb, spine of a fish) plus -ίνη.",
		etymology: [
			"From Ancient Greek ἀθερίνη atherínē (sand smelt)",
			"↳ From ἀθήρ athḗr (awn, barb, spine of a fish) with the suffix -ίνη -ínē",
		].join("\n"),
	},
	{
		id: "nm_0418",
		why: "Missed the diminutive that produced the modern form. el.wiktionary μύδι, citing ΛΚΝ: from Koine μύδιον, diminutive of μῦς.",
		etymology: [
			"From Koine Greek μύδιον mýdion (small mussel), diminutive of Ancient Greek μῦς mŷs (mussel)",
			"↳ The same word μῦς mŷs also means mouse and muscle",
		].join("\n"),
	},
	{
		id: "nm_0387",
		why:
			"First line derived σκορπίος from itself. It is one word: the scorpion name applied to " +
			"the fish for its venomous spines (LSJ, via en.wiktionary σκορπίος).",
		etymology: [
			"From Ancient Greek σκορπίος skorpíos (scorpion), the same word applied to the fish",
			"↳ Named for its venomous dorsal spines",
		].join("\n"),
	},
	{
		id: "nm_0383",
		why: "Stated the weasel derivation flat. en.wiktionary γαλεός hedges it: possibly named after the weasel.",
		etymology: [
			"From Ancient Greek γαλεός galeós (dogfish, small shark)",
			"↳ Possibly named after γαλέη galéē (weasel), for its appearance",
		].join("\n"),
	},
	{
		id: "nm_0318",
		why:
			"Only note was that Aristotle mentions it. en.wiktionary σκάρος: Beekes suggests σκαίρω " +
			"for its lively movements, or σκαρῖτις if named for its colour.",
		etymology: [
			"From Ancient Greek σκάρος skáros (parrotfish)",
			"↳ Origin uncertain; Beekes suggests a relation to σκαίρω skaírō (to skip, to dance) for its lively movements, or to σκαρῖτις skarîtis (a kind of stone) if the name is from its colour",
		].join("\n"),
	},

	// --------------------------------------------- PROPAGATION / HARMONISING
	{
		id: "nm_0041",
		why:
			"Asserted Pre-Greek flat where its own ancestor record nm_0391 (and en.wiktionary σάλπη) " +
			"puts the Egyptian hypothesis first. Harmonised with nm_0391 and nm_0479.",
		etymology: [
			"From Ancient Greek σάλπη sálpē (salema)",
			"↳ Origin uncertain, possibly from Egyptian; compare Coptic ⲥⲗⲃⲟⲧ slbot and Arabic شِلْبَا šilbā",
			"↳ Or perhaps already Pre-Greek, the Egyptian and Greek forms sharing a common source (Beekes)",
		].join("\n"),
	},
	{
		id: "nm_0479",
		why: "Same σάλπη chain as nm_0041/nm_0391; the last line asserted Pre-Greek where the other two hedge.",
		etymology: [
			"From Greek σάρπα sárpa (salema)",
			"↳ Variant of σάλπα sálpa with r/l alternation",
			"↳ From Ancient Greek σάλπη sálpē (salema), origin uncertain — possibly from Egyptian, or already Pre-Greek with the Egyptian forms sharing a common source (Beekes)",
		].join("\n"),
	},
	{
		id: "nm_0372",
		why:
			"Ended on a false cognate: Latin mugil is an unrelated word, not a relative of κέφαλος. " +
			"en.wiktionary κέφαλος gives Latin cephalus as the borrowing from it.",
		etymology: [
			"From Ancient Greek κέφαλος képhalos (grey mullet)",
			"↳ From κεφαλή kephalḗ (head), the fish being large-headed",
			"↳ Borrowed into Latin as cephalus (grey mullet)",
		].join("\n"),
	},
	{
		id: "nm_0399",
		why: "Propagates nm_0372: the Modern Greek record carried the same false Latin mugil cognate.",
		etymology: [
			"From Ancient Greek κέφαλος képhalos (grey mullet)",
			"↳ From κεφαλή kephalḗ (head), the fish being large-headed",
			"↳ Borrowed into Latin as cephalus (grey mullet)",
		].join("\n"),
	},
];

function main() {
	const db = new Database("public/fish.db");
	const read = db.prepare(
		"SELECT id, name, etymology, transliteration, phonetic FROM names WHERE id = ?",
	);

	let changed = 0;
	let unchanged = 0;
	const missing: string[] = [];

	const run = db.transaction(() => {
		for (const fix of FIXES) {
			const row = read.get(fix.id) as
				| { id: string; name: string; etymology: string; transliteration: string; phonetic: string }
				| undefined;
			if (!row) {
				missing.push(fix.id);
				continue;
			}

			const target = {
				name: fix.name ?? row.name,
				etymology: fix.etymology,
				transliteration: fix.transliteration ?? row.transliteration,
				phonetic: fix.phonetic ?? row.phonetic,
			};

			const same =
				row.name === target.name &&
				row.etymology === target.etymology &&
				row.transliteration === target.transliteration &&
				row.phonetic === target.phonetic;

			console.log(`\n=== ${fix.id} ${row.name} ===`);
			console.log(`why: ${fix.why}`);
			if (same) {
				console.log("BEFORE == AFTER (already applied, skipping)");
				unchanged++;
				continue;
			}

			console.log("BEFORE:");
			if (row.name !== target.name)
				console.log(`  name/translit/phonetic: ${row.name} | ${row.transliteration} | ${row.phonetic}`);
			console.log(
				row.etymology
					.split("\n")
					.map((l) => `  ${l}`)
					.join("\n"),
			);
			console.log("AFTER:");
			if (row.name !== target.name)
				console.log(
					`  name/translit/phonetic: ${target.name} | ${target.transliteration} | ${target.phonetic}`,
				);
			console.log(
				target.etymology
					.split("\n")
					.map((l) => `  ${l}`)
					.join("\n"),
			);

			db.prepare(
				`UPDATE names
				 SET name = ?, etymology = ?, transliteration = ?, phonetic = ?,
				     updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
				 WHERE id = ?`,
			).run(target.name, target.etymology, target.transliteration, target.phonetic, fix.id);
			changed++;
		}
	});

	run();

	console.log(`\n--- TREK-569 summary ---`);
	console.log(`records in fix set: ${FIXES.length}`);
	console.log(`updated:            ${changed}`);
	console.log(`already correct:    ${unchanged}`);
	if (missing.length) console.log(`MISSING IDS:        ${missing.join(", ")}`);

	db.close();
}

main();
