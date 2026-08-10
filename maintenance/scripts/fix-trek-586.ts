/**
 * TREK-586 — ten new marine-arthropod species and their vernacular names
 * (GH#62), compiled from four validation passes over the source issue.
 *
 * Scope is deliberately narrow: only the ten species below and their names.
 * The issue also raised fixes to existing records (nm_0091, nm_0483,
 * nm_0422), species-ambiguity additions on sp_020/sp_025/sp_088, and
 * lobster/blue-crab size-and-stage names on sp_020/sp_023 — all of that is
 * section A/C/D of TREK-586 and is explicitly a *second pass*, not this
 * script.
 *
 * Corrections applied here vs. the raw GH issue (TREK-586 section B/E):
 *  - centolla (spa): "Galician origin" is unsourceable -> origin uncertain.
 *  - granseola (ita): NOT a diminutive of granzo. Compound: Venetian granzo
 *    (crab) + zeola (onion), for the carapace shape.
 *  - deniz palamudu (tur): via Ottoman palamut (acorn) <- Greek diminutive
 *    βαλανίδιον <- βάλανος. NOT directly from βάλανος. palamut is flagged as
 *    a homonym of the unrelated bonito-fish palamut already in the corpus.
 *  - erakkorapu (fin): erakko is native Finnish (erä "tract/wilderness" +
 *    -kko), NOT from Greek erēmos, despite resembling the genuine loanword
 *    eremiitti.
 *  - canocchia (ita): the "from pannocchia" claim is unverified in any
 *    dictionary -> written as origin uncertain.
 *  - scampo (ita): NOT "origin uncertain" — two sourced Greek derivations
 *    (κάμπος "sea monster" / καμπή "bending"), presented hedged.
 *  - κωπήποδο / hankajalkainen / copepod: three parallel coinages/calques of
 *    the same Greek roots (κώπη "oar" + πούς/ποδ- "foot"), NOT borrowings of
 *    one another — each etymology is self-contained, no cross-language
 *    cognate remarks (AGENTS.md keeps that out of `etymology`).
 *  - Latin/New Latin genus-species epithets are not vernacular names and get
 *    no `names` row (Nephrops, Maja, Squilla, Euphausia, Ligia, Talitrus,
 *    Calanus, Limulus, Pagurus, Semibalanus never appear as `names.name`).
 *  - No starred reconstruction is asserted unless a real dictionary prints
 *    it. Proto-Turkic *yeŋgeç and *bürge are attested reconstructions
 *    (comparative Turkic dictionaries / Wiktionary); *skrimp- and *bȫgček
 *    style inventions are avoided throughout — e.g. "shrimp" and "barnacle"
 *    (eng) are written as genuinely uncertain rather than guessing a root.
 *
 * Relations: name_relations is same-species constrained, so only pairs
 * within one of these ten new species are added — a Turkish/Greek borrowing
 * on Nephrops, and three krill borrowings + one copepod borrowing, all
 * sourced. Every cross-species root cluster in the issue (κάβουρας, βάλανος,
 * yengeç, etc.) stays in prose etymology only, per TREK-586 section F.
 *
 * Idempotent: re-running reports every item as already current.
 *
 * Run: pnpm tsx maintenance/scripts/fix-trek-586.ts
 */

import Database from "better-sqlite3";
import { resolve } from "node:path";

const DB_PATH = resolve(import.meta.dirname, "../../public/fish.db");
const NOW = "strftime('%Y-%m-%dT%H:%M:%SZ','now')";

const db = new Database(DB_PATH);

let speciesAdded = 0;
let namesAdded = 0;
let relationsAdded = 0;
let alreadyCurrent = 0;

function nextSpeciesId(): string {
	const row = db
		.prepare(
			"SELECT 'sp_' || printf('%03d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) AS id FROM species",
		)
		.get() as { id: string };
	return row.id;
}

function nextNameId(): string {
	const row = db
		.prepare(
			"SELECT 'nm_' || printf('%04d', MAX(CAST(SUBSTR(id, 4) AS INTEGER)) + 1) AS id FROM names",
		)
		.get() as { id: string };
	return row.id;
}

function ensureSpecies(scientificName: string, notes: string): string {
	const existing = db
		.prepare("SELECT id FROM species WHERE scientific_name = ?")
		.get(scientificName) as { id: string } | undefined;
	if (existing) {
		console.log(`  = species ${scientificName} already exists as ${existing.id}`);
		alreadyCurrent++;
		return existing.id;
	}
	const id = nextSpeciesId();
	db.prepare(
		`INSERT INTO species (id, scientific_name, notes, updated_at) VALUES (?, ?, ?, ${NOW})`,
	).run(id, scientificName, notes);
	console.log(`  + ${id} ${scientificName}`);
	speciesAdded++;
	return id;
}

interface NameSpec {
	key: string; // stable lookup key used for relations, e.g. "nephrops:eng:Norway lobster"
	name: string;
	speciesId: string;
	region: string;
	lang: string;
	etymology: string;
	transliteration: string;
	phonetic: string;
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
		`INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ${NOW})`,
	).run(
		id,
		spec.name,
		spec.speciesId,
		spec.region,
		spec.lang,
		spec.etymology,
		spec.transliteration,
		spec.phonetic,
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

console.log("=== TREK-586: ten new marine-arthropod species ===\n");

// ------------------------------------------------------------- 1. Nephrops
{
	console.log("-- Nephrops norvegicus (Norway lobster) --");
	const sp = ensureSpecies(
		"Nephrops norvegicus",
		"Norway lobster, a slender orange-pink lobster about 20 cm long with long narrow claws. Burrows in muddy seabed sediment at depths of 20-800 m. Found in the north-east Atlantic and the Mediterranean.",
	);

	ensureName({
		key: "nephrops:eng:norway-lobster",
		name: "Norway lobster",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology:
			"Compound: Norway + lobster\nNorway: named for the fishing grounds off the Norwegian coast, lobster: large clawed crustacean\n↳ lobster from Middle English lopster, from Old English loppestre, likely an alteration of Latin locusta (locust) influenced by loppe (spider)",
		transliteration: "Norway lobster",
		phonetic: "[norway lobster]",
	});
	ensureName({
		key: "nephrops:eng:dublin-bay-prawn",
		name: "Dublin Bay prawn",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology:
			"Compound: Dublin Bay + prawn\nDublin Bay: named for the bay in Dublin, Ireland, where the catch was traditionally landed and sold, prawn: from Middle English prayne, origin uncertain",
		transliteration: "Dublin Bay prawn",
		phonetic: "[dublin bay prawn]",
	});
	ensureName({
		key: "nephrops:fra:langoustine",
		name: "langoustine",
		speciesId: sp,
		region: "france",
		lang: "fra",
		etymology:
			"From French langouste (spiny lobster) + diminutive suffix -ine\n↳ langouste from Old Occitan langosta, from Vulgar Latin lacusta, from Latin locusta (locust, crustacean)",
		transliteration: "langoustine",
		phonetic: "/lɑ̃ɡustin/",
	});
	ensureName({
		key: "nephrops:ita:scampo",
		name: "scampo",
		speciesId: sp,
		region: "italy",
		lang: "ita",
		etymology:
			"From Venetian scampo (Norway lobster)\n↳ possibly from Ancient Greek κάμπος kámpos (sea monster), or from Ancient Greek καμπή kampḗ (bending, curve), referring to the animal's curled tail",
		transliteration: "scampo",
		phonetic: "/ˈskampo/",
	});
	ensureName({
		key: "nephrops:fin:keisarihummeri",
		name: "keisarihummeri",
		speciesId: sp,
		region: "finland",
		lang: "fin",
		etymology:
			"Compound: keisari + hummeri\nkeisari: emperor, hummeri: lobster\n↳ keisari from Swedish kejsare (emperor), ultimately from Latin Caesar (the imperial title)\n↳ hummeri from Swedish hummer (lobster), from Old Norse humarr (lobster)",
		transliteration: "keisarihummeri",
		phonetic: "/ˈkeisɑrihumːeri/",
	});
	ensureName({
		key: "nephrops:ell:karavida",
		name: "καραβίδα",
		speciesId: sp,
		region: "greek",
		lang: "ell",
		etymology:
			"From Ancient Greek κάραβος kárabos (crab, crayfish)\n↳ In Modern Greek, καραβίδα karavída extended from the freshwater crayfish to also denote Nephrops norvegicus, the Norway lobster",
		transliteration: "Karavida",
		phonetic: "/karaˈviða/",
	});
	ensureName({
		key: "nephrops:tur:karavide",
		name: "karavide",
		speciesId: sp,
		region: "turkey",
		lang: "tur",
		etymology:
			"From Greek καραβίδα karavída (crayfish, crawfish)\n↳ From Ancient Greek κάραβος kárabos (crab, crayfish)",
		transliteration: "karavide",
		phonetic: "/kaɾaviˈde/",
	});

	ensureRelation(
		"nephrops:tur:karavide",
		"nephrops:ell:karavida",
		"borrowed_from",
		"Turkish karavide borrowed from Greek καραβίδα karavída",
	);
}

// -------------------------------------------------------------- 2. Pagurus
{
	console.log("\n-- Pagurus bernhardus (hermit crab) --");
	const sp = ensureSpecies(
		"Pagurus bernhardus",
		"Hermit crab that occupies empty gastropod shells for protection, its soft asymmetric abdomen having no hard covering of its own. Found in the north-east Atlantic from the intertidal zone to about 500 m depth.",
	);

	ensureName({
		key: "pagurus:eng:hermit-crab",
		name: "hermit crab",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology:
			"Compound: hermit + crab\nhermit: one who lives in solitude, crab: crustacean\n↳ hermit from Old French eremite, from Late Latin eremita, from Ancient Greek ἐρημίτης erēmítēs (of the desert), from ἔρημος érēmos (desert, deserted)",
		transliteration: "hermit crab",
		phonetic: "[hermit crab]",
	});
	ensureName({
		key: "pagurus:fin:erakkorapu",
		name: "erakkorapu",
		speciesId: sp,
		region: "finland",
		lang: "fin",
		etymology:
			"Compound: erakko + rapu\nerakko: hermit, rapu: crab, crayfish\n↳ erakko is a native Finnish formation from erä (tract, wilderness) + -kko (place/collective suffix), not a loan from Greek ἐρημίτης erēmítēs, which instead gave the separate Finnish loanword eremiitti",
		transliteration: "erakkorapu",
		phonetic: "/ˈerɑkːorɑpu/",
	});
	ensureName({
		key: "pagurus:tur:kesis-yengeci",
		name: "keşiş yengeci",
		speciesId: sp,
		region: "turkey",
		lang: "tur",
		etymology:
			"Compound: keşiş + yengeç\nkeşiş: monk, yengeç: crab\n↳ keşiş from Ottoman Turkish keşiş, from Persian keşiş, from Syriac ܩܫܝܫܐ qaššīšā (elder, priest)\n↳ yengeç from Old Anatolian Turkish yengeç, from Proto-Turkic *yeŋgeç (crab)",
		transliteration: "kesis yengeci",
		phonetic: "/keˈʃiʃ jenɟeˈdʒi/",
	});
	ensureName({
		key: "pagurus:ell:eremitis-kavouras",
		name: "ερημίτης κάβουρας",
		speciesId: sp,
		region: "greek",
		lang: "ell",
		etymology:
			"Compound: ερημίτης + κάβουρας\nερημίτης erēmítēs: hermit, κάβουρας kávouras: crab\n↳ ερημίτης from Ancient Greek ἐρημίτης erēmítēs (of the desert), from ἔρημος érēmos (desert, deserted)\n↳ κάβουρας from Byzantine Greek κάβουρας, from Koine Greek κάβουρος kávouros, from Ancient Greek πάγουρος págouros (a type of crab)",
		transliteration: "Erimitis Kavouras",
		phonetic: "/eriˈmitis ˈkavuras/",
	});
	ensureName({
		key: "pagurus:fra:bernard-l-ermite",
		name: "bernard-l'ermite",
		speciesId: sp,
		region: "france",
		lang: "fra",
		etymology:
			"Compound: Bernard + l'ermite\nBernard: a personal name, of unexplained motivation, l'ermite: the hermit\n↳ l'ermite from Old French eremite, from Late Latin eremita, from Ancient Greek ἐρημίτης erēmítēs (of the desert), from ἔρημος érēmos (desert, deserted)",
		transliteration: "bernard-l'ermite",
		phonetic: "/bɛʁnaʁ lɛʁmit/",
	});
}

// ------------------------------------------------------------------ 3. Maja
{
	console.log("\n-- Maja squinado (spider crab) --");
	const sp = ensureSpecies(
		"Maja squinado",
		"Large spider crab with a spiny reddish carapace reaching about 20 cm across, and long slender legs. Found in the north-east Atlantic and the Mediterranean.",
	);

	ensureName({
		key: "maja:eng:spider-crab",
		name: "spider crab",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology:
			"Compound: spider + crab\nspider: eight-legged arachnid, for the long spindly legs, crab: crustacean\n↳ spider from Old English spiþra, related to spinnan (to spin), for spinning webs",
		transliteration: "spider crab",
		phonetic: "[spider crab]",
	});
	ensureName({
		key: "maja:fra:araignee-de-mer",
		name: "araignée de mer",
		speciesId: sp,
		region: "france",
		lang: "fra",
		etymology:
			"Compound: araignée + de mer\naraignée: spider, de mer: of the sea\n↳ araignée from Old French araigne, from Latin aranea (spider)",
		transliteration: "araignee de mer",
		phonetic: "/aʁɛɲe də mɛʁ/",
	});
	// Correction (TREK-586): "Galician origin" is unsourceable — write origin uncertain.
	ensureName({
		key: "maja:spa:centolla",
		name: "centolla",
		speciesId: sp,
		region: "spain",
		lang: "spa",
		etymology: "Spanish centolla (spider crab); origin uncertain — no dictionary source establishes its derivation",
		transliteration: "centolla",
		phonetic: "/θenˈtoʎa/",
	});
	// Correction (TREK-586): NOT a diminutive of granzo — a compound with zeola (onion).
	ensureName({
		key: "maja:ita:granseola",
		name: "granseola",
		speciesId: sp,
		region: "italy",
		lang: "ita",
		etymology:
			"Compound: granzo + zeola\ngranzo: crab, zeola: onion, for the rounded carapace shape\n↳ Venetian compound; granzo from Latin cancer (crab), zeola a diminutive of ceola/cevolla (onion), from Latin cepulla, from cepa (onion)",
		transliteration: "granseola",
		phonetic: "/granˈsɛola/",
	});
	ensureName({
		key: "maja:ell:kavouromana",
		name: "καβουρομάνα",
		speciesId: sp,
		region: "greek",
		lang: "ell",
		etymology:
			"Compound: κάβουρας + μάνα\nκάβουρας kávouras: crab, μάνα mána: mother, for its unusually large size compared to other crabs\n↳ κάβουρας from Byzantine Greek κάβουρας, from Koine Greek κάβουρος kávouros, from Ancient Greek πάγουρος págouros (a type of crab)\n↳ μάνα from Koine Greek μάννα (a nursery word for mother)",
		transliteration: "Kavouromana",
		phonetic: "/kavuroˈmana/",
	});
	ensureName({
		key: "maja:tur:ayi-yengeci",
		name: "ayı yengeci",
		speciesId: sp,
		region: "turkey",
		lang: "tur",
		etymology:
			"Compound: ayı + yengeç\nayı: bear, yengeç: crab\n↳ ayı from Old Turkic adığ (bear), of Proto-Turkic origin\n↳ yengeç from Old Anatolian Turkish yengeç, from Proto-Turkic *yeŋgeç (crab)",
		transliteration: "ayi yengeci",
		phonetic: "/aˈjɯ jenɟeˈdʒi/",
	});
}

// --------------------------------------------------------------- 4. Squilla
{
	console.log("\n-- Squilla mantis (mantis shrimp) --");
	const sp = ensureSpecies(
		"Squilla mantis",
		"Burrowing mantis shrimp about 20 cm long, with enlarged raptorial forelimbs used to strike prey. Lives in soft sediment of the Mediterranean and eastern Atlantic.",
	);

	ensureName({
		key: "squilla:eng:mantis-shrimp",
		name: "mantis shrimp",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology:
			"Compound: mantis + shrimp\nmantis: for its resemblance to the praying mantis insect, shrimp: small crustacean, of uncertain Germanic origin\n↳ mantis from Ancient Greek μάντις mántis (prophet, seer), for the insect's prayer-like forelimb posture",
		transliteration: "mantis shrimp",
		phonetic: "[mantis shrimp]",
	});
	// Correction (TREK-586): the "from pannocchia" claim is unverified — write origin uncertain.
	ensureName({
		key: "squilla:ita:canocchia",
		name: "canocchia",
		speciesId: sp,
		region: "italy",
		lang: "ita",
		etymology:
			"Italian canocchia (mantis shrimp); origin uncertain — the popular claim that it derives from pannocchia (corn cob) is not attested in any dictionary",
		transliteration: "canocchia",
		phonetic: "/kaˈnɔkkja/",
	});
	ensureName({
		key: "squilla:fra:squille",
		name: "squille",
		speciesId: sp,
		region: "france",
		lang: "fra",
		etymology:
			"From French squille (mantis shrimp)\n↳ From Latin squilla (shrimp, prawn), origin uncertain beyond Latin",
		transliteration: "squille",
		phonetic: "/skij/",
	});
}

// ------------------------------------------------------------- 5. Euphausia
{
	console.log("\n-- Euphausia superba (Antarctic krill) --");
	const sp = ensureSpecies(
		"Euphausia superba",
		"Antarctic krill, a shrimp-like crustacean about 6 cm long that forms vast, often bioluminescent swarms in the Southern Ocean; a key food source for whales, seals, penguins and fish.",
	);

	ensureName({
		key: "euphausia:eng:krill",
		name: "krill",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology: "From Norwegian dialect kril (small fry of fish, small creature)",
		transliteration: "krill",
		phonetic: "[krill]",
	});
	ensureName({
		key: "euphausia:fin:krilli",
		name: "krilli",
		speciesId: sp,
		region: "finland",
		lang: "fin",
		etymology:
			"From English krill (a small planktonic crustacean)\n↳ krill from Norwegian dialect kril (small fry of fish, small creature)",
		transliteration: "krilli",
		phonetic: "/ˈkrilli/",
	});
	ensureName({
		key: "euphausia:tur:kril",
		name: "kril",
		speciesId: sp,
		region: "turkey",
		lang: "tur",
		etymology:
			"From English krill (a small planktonic crustacean)\n↳ krill from Norwegian dialect kril (small fry of fish, small creature)",
		transliteration: "kril",
		phonetic: "/kɾil/",
	});
	ensureName({
		key: "euphausia:ell:kril",
		name: "κριλ",
		speciesId: sp,
		region: "greek",
		lang: "ell",
		etymology:
			"From English krill (a small planktonic crustacean)\n↳ krill from Norwegian dialect kril (small fry of fish, small creature)",
		transliteration: "Kril",
		phonetic: "/kril/",
	});

	ensureRelation(
		"euphausia:fin:krilli",
		"euphausia:eng:krill",
		"borrowed_from",
		"Finnish krilli borrowed from English krill",
	);
	ensureRelation(
		"euphausia:tur:kril",
		"euphausia:eng:krill",
		"borrowed_from",
		"Turkish kril borrowed from English krill",
	);
	ensureRelation(
		"euphausia:ell:kril",
		"euphausia:eng:krill",
		"borrowed_from",
		"Greek κριλ borrowed from English krill",
	);
}

// ----------------------------------------------------------------- 6. Ligia
{
	console.log("\n-- Ligia oceanica (sea slater) --");
	const sp = ensureSpecies(
		"Ligia oceanica",
		"Sea slater, a large marine isopod about 3 cm long. Nocturnal, sheltering by day and foraging at night on rocky shores above the high-water line in the north-east Atlantic.",
	);

	ensureName({
		key: "ligia:eng:sea-slater",
		name: "sea slater",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology:
			"Compound: sea + slater\nsea: marine habitat, slater: isopod crustacean resembling a woodlouse\n↳ slater in this sense is of uncertain origin, apparently unrelated to slater (one who lays roof slates)",
		transliteration: "sea slater",
		phonetic: "[sea slater]",
	});
	ensureName({
		key: "ligia:fin:merisiira",
		name: "merisiira",
		speciesId: sp,
		region: "finland",
		lang: "fin",
		etymology:
			"Compound: meri + siira\nmeri: sea, siira: isopod, woodlouse-like crustacean\n↳ siira is a native Finnish dialectal word for isopod crustaceans, of uncertain further origin",
		transliteration: "merisiira",
		phonetic: "/ˈmerisiːrɑ/",
	});
	ensureName({
		key: "ligia:tur:deniz-tespih-bocegi",
		name: "deniz tespih böceği",
		speciesId: sp,
		region: "turkey",
		lang: "tur",
		etymology:
			"Compound: deniz + tespih + böceği\ndeniz: sea, tespih: prayer beads, böceği: its bug/insect, for the beaded segmented body\n↳ tespih from Ottoman Turkish tesbih, from Arabic تَسْبِيح tasbīḥ (praise, glorification)\n↳ böceği from böcek (bug, insect), of Turkic origin",
		transliteration: "deniz tespih bocegi",
		phonetic: "/deˈniz tesˈpih bœdʒeˈi/",
	});
}

// -------------------------------------------------------------- 7. Talitrus
{
	console.log("\n-- Talitrus saltator (sandhopper) --");
	const sp = ensureSpecies(
		"Talitrus saltator",
		"Sandhopper, a small amphipod about 2 cm long that burrows in beach sand above the tideline and leaps vigorously when disturbed. Common on north-east Atlantic and Mediterranean shores.",
	);

	ensureName({
		key: "talitrus:eng:sandhopper",
		name: "sandhopper",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology:
			"Compound: sand + hopper\nsand: fine granular substrate, hopper: one that hops\n↳ hopper from Old English hoppian (to hop, dance), for the animal's jumping locomotion",
		transliteration: "sandhopper",
		phonetic: "[sandhopper]",
	});
	ensureName({
		key: "talitrus:fin:hietakirppu",
		name: "hietakirppu",
		speciesId: sp,
		region: "finland",
		lang: "fin",
		etymology:
			"Compound: hieta + kirppu\nhieta: sand, kirppu: flea\n↳ hieta a native Finnish word for fine sand (a variant of hiekka)\n↳ kirppu a native Finnic word for flea",
		transliteration: "hietakirppu",
		phonetic: "/ˈhietɑkirppu/",
	});
	ensureName({
		key: "talitrus:tur:kum-piresi",
		name: "kum piresi",
		speciesId: sp,
		region: "turkey",
		lang: "tur",
		etymology:
			"Compound: kum + pire\nkum: sand, pire: flea\n↳ pire from Ottoman Turkish پیره pire, from Proto-Turkic *bürge (flea)",
		transliteration: "kum piresi",
		phonetic: "/kum piɾeˈsi/",
	});
	ensureName({
		key: "talitrus:ell:ammopsyllos",
		name: "αμμόψυλλος",
		speciesId: sp,
		region: "greek",
		lang: "ell",
		etymology:
			"Compound: άμμος + ψύλλος\nάμμος ámmos: sand, ψύλλος psýllos: flea\n↳ άμμος of uncertain pre-Greek substrate origin (Beekes)\n↳ ψύλλος an inherited Ancient Greek word for flea, ultimate Indo-European root disputed",
		transliteration: "Ammopsyllos",
		phonetic: "/aˈmopsilos/",
	});
}

// -------------------------------------------------------------- 8. Calanus
{
	console.log("\n-- Calanus finmarchicus (copepod) --");
	const sp = ensureSpecies(
		"Calanus finmarchicus",
		"Copepod about 3 mm long, the dominant zooplankton species of the North Atlantic and a key forage species for fish, seabirds and whales.",
	);

	// copepod / hankajalkainen / κωπήποδο are parallel coinages of the same
	// Greek roots (κώπη "oar" + πούς/ποδ- "foot"), not borrowings of each
	// other — each entry below is self-contained and does not cross-reference
	// the others (AGENTS.md keeps cognate remarks out of `etymology`).
	ensureName({
		key: "calanus:eng:copepod",
		name: "copepod",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology:
			"From New Latin Copepoda, coined by Henri Milne-Edwards in the 1830s\n↳ Compound: κώπη + πούς\nκώπη kṓpē: oar, πούς poús: foot, for the oar-like swimming legs",
		transliteration: "copepod",
		phonetic: "[copepod]",
	});
	ensureName({
		key: "calanus:fin:hankajalkainen",
		name: "hankajalkainen",
		speciesId: sp,
		region: "finland",
		lang: "fin",
		etymology: "Compound: hanka + jalkainen\nhanka: oar, oarlock, jalkainen: footed, from jalka (foot)",
		transliteration: "hankajalkainen",
		phonetic: "/ˈhaŋkɑjɑlkɑinen/",
	});
	ensureName({
		key: "calanus:tur:kopepod",
		name: "kopepod",
		speciesId: sp,
		region: "turkey",
		lang: "tur",
		etymology:
			"From English copepod (a small planktonic crustacean)\n↳ Compound: κώπη + πούς\nκώπη kṓpē: oar, πούς poús: foot, roots of New Latin Copepoda",
		transliteration: "kopepod",
		phonetic: "/kopeˈpod/",
	});
	ensureName({
		key: "calanus:ell:kopipodo",
		name: "κωπήποδο",
		speciesId: sp,
		region: "greek",
		lang: "ell",
		etymology:
			"Compound: κώπη + πόδι\nκώπη kṓpē: oar, πόδι pódi: foot\n↳ Modern Greek scientific coinage from the Ancient Greek roots κώπη (oar) and πούς/ποδ- (foot), for the oar-like swimming legs",
		transliteration: "Kopipodo",
		phonetic: "/kopiˈpoðo/",
	});

	ensureRelation(
		"calanus:tur:kopepod",
		"calanus:eng:copepod",
		"borrowed_from",
		"Turkish kopepod borrowed from English copepod",
	);
}

// -------------------------------------------------------------- 9. Limulus
{
	console.log("\n-- Limulus polyphemus (Atlantic horseshoe crab) --");
	const sp = ensureSpecies(
		"Limulus polyphemus",
		"Atlantic horseshoe crab, a chelicerate arthropod (not a true crab) with a horseshoe-shaped carapace and a long spike-like tail. Found along the western Atlantic coast of North America.",
	);

	ensureName({
		key: "limulus:eng:horseshoe-crab",
		name: "horseshoe crab",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology:
			"Compound: horseshoe + crab\nhorseshoe: for the U-shaped carapace, crab: crustacean-like sea creature (though not a true crab)",
		transliteration: "horseshoe crab",
		phonetic: "[horseshoe crab]",
	});
	// Research could not confirm "molukki-"; written as origin uncertain rather
	// than invented, per house convention.
	ensureName({
		key: "limulus:fin:molukkirapu",
		name: "molukkirapu",
		speciesId: sp,
		region: "finland",
		lang: "fin",
		etymology:
			"Compound: molukki + rapu\nmolukki: origin uncertain, rapu: crab\n↳ the derivation of molukki is not established in Finnish dictionaries; if it refers to the Moluccas (Maluku Islands, Indonesia), the association is unclear given the western Atlantic range of this species",
		transliteration: "molukkirapu",
		phonetic: "/ˈmolukːirɑpu/",
	});
	ensureName({
		key: "limulus:tur:at-nali-yengeci",
		name: "at nalı yengeci",
		speciesId: sp,
		region: "turkey",
		lang: "tur",
		etymology:
			"Compound: at nalı + yengeç\nat nalı: horseshoe, yengeç: crab\n↳ at nalı from at (horse, native Turkic) + nal (horseshoe), from Ottoman Turkish نعل naʿl, from Arabic نَعْل naʿl (sandal, horseshoe)\n↳ yengeç from Old Anatolian Turkish yengeç, from Proto-Turkic *yeŋgeç (crab)",
		transliteration: "at nali yengeci",
		phonetic: "/at naˈlɯ jenɟeˈdʒi/",
	});
	ensureName({
		key: "limulus:ell:petalokavouras",
		name: "πεταλοκάβουρας",
		speciesId: sp,
		region: "greek",
		lang: "ell",
		etymology:
			"Compound: πέταλο + κάβουρας\nπέταλο pétalo: horseshoe, κάβουρας kávouras: crab\n↳ πέταλο from Ancient Greek πέταλον pétalon (leaf, flat plate), extended in Modern Greek to mean horseshoe\n↳ κάβουρας from Byzantine Greek κάβουρας, from Koine Greek κάβουρος kávouros, from Ancient Greek πάγουρος págouros (a type of crab)",
		transliteration: "Petalokavouras",
		phonetic: "/petalokaˈvuras/",
	});
}

// --------------------------------------------------------- 10. Semibalanus
{
	console.log("\n-- Semibalanus balanoides (common acorn barnacle) --");
	const sp = ensureSpecies(
		"Semibalanus balanoides",
		"Common acorn barnacle, a sessile filter-feeding crustacean enclosed in conical calcareous plates cemented to rock. Abundant on North Atlantic intertidal shores.",
	);

	// etymonline itself calls this disputed — written as uncertain rather
	// than asserting the popular Celtic story as settled fact.
	ensureName({
		key: "semibalanus:eng:barnacle",
		name: "barnacle",
		speciesId: sp,
		region: "international",
		lang: "eng",
		etymology:
			"English barnacle; origin disputed. Often compared to a Celtic root (compare Breton bernik, limpet), but the word is first recorded for the barnacle goose, with the shellfish sense following later, so a single clean derivation is not established",
		transliteration: "barnacle",
		phonetic: "[barnacle]",
	});
	ensureName({
		key: "semibalanus:fin:merirokko",
		name: "merirokko",
		speciesId: sp,
		region: "finland",
		lang: "fin",
		etymology:
			"Compound: meri + rokko\nmeri: sea, rokko: pox, pustule, for the volcano-like conical shell plates\n↳ rokko a native Finnish word for pox/rash, of Finno-Ugric origin",
		transliteration: "merirokko",
		phonetic: "/ˈmerirokːo/",
	});
	// Correction (TREK-586): via Ottoman palamut (acorn) <- Greek diminutive
	// βαλανίδιον <- βάλανος, NOT directly from βάλανος. Flagged as a homonym
	// of the unrelated bonito-fish palamut already in the corpus (nm_0065).
	ensureName({
		key: "semibalanus:tur:deniz-palamudu",
		name: "deniz palamudu",
		speciesId: sp,
		region: "turkey",
		lang: "tur",
		etymology:
			"Compound: deniz + palamut\ndeniz: sea, palamut: acorn\n↳ palamut from Ottoman Turkish palamut (acorn), from Byzantine Greek βαλανίδιον balanídion (little acorn), diminutive of βάλανος bálanos (acorn)\n↳ this palamut is a homonym of the unrelated Turkish palamut meaning bonito (a tuna-like fish also in this database), which has a separate Greek etymology",
		transliteration: "deniz palamudu",
		phonetic: "/deˈniz palaˈmudu/",
	});
	ensureName({
		key: "semibalanus:ell:valanos",
		name: "βαλανός",
		speciesId: sp,
		region: "greek",
		lang: "ell",
		etymology:
			"From Ancient Greek βάλανος bálanos (acorn), used for the barnacle's acorn-shaped shell\n↳ of Indo-European origin; Beekes rejects a proposed link to βάλλω bállō (to throw) despite the surface resemblance",
		transliteration: "Valanos",
		phonetic: "/valaˈnos/",
	});
	ensureName({
		key: "semibalanus:deu:seepocke",
		name: "Seepocke",
		speciesId: sp,
		region: "germany",
		lang: "deu",
		etymology:
			"Compound: See + Pocke\nSee: sea, Pocke: pock, pustule, for the volcano-like conical shell plates\n↳ Pocke from Middle Low German pocke, related to English pock",
		transliteration: "Seepocke",
		phonetic: "/ˈzeːpɔkə/",
	});
}

const counts = db
	.prepare(
		"SELECT (SELECT COUNT(*) FROM names) AS n, (SELECT COUNT(*) FROM species) AS s, (SELECT COUNT(*) FROM name_relations) AS r",
	)
	.get() as { n: number; s: number; r: number };
db.close();

console.log(
	`\n${speciesAdded} species added, ${namesAdded} names added, ${relationsAdded} relations added, ${alreadyCurrent} already current`,
);
console.log(`Totals now: ${counts.n} names, ${counts.s} species, ${counts.r} relations.`);
if (speciesAdded + namesAdded + relationsAdded > 0) console.log("Commit public/fish.db.");
