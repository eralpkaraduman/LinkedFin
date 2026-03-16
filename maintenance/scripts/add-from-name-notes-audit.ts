/**
 * Add confirmed relations and names from the name_notes_export audit.
 *
 * Relations (6):
 *  - nm_0362 (أنشوفة) borrowed_from nm_0467 (Acciuga)
 *  - nm_0453 (Monkfish) alternate_of nm_0474 (Anglerfish)
 *  - nm_0311 (Sea trout) alternate_of nm_0308 (Meritaimen)
 *  - nm_0311 (Sea trout) alternate_of nm_0309 (Havsöring)
 *  - nm_0197 (Μελανούρι) confused_with nm_0011 (Σκαθάρι)
 *  - nm_0394 (κεστρεύς) alternate_of nm_0372 (κέφαλος)
 *
 * Names (5):
 *  - Meriforell (est, Salmo trutta / sp_033)
 *  - St. Peter's fish (eng, Zeus faber / sp_078)
 *  - Dikenli ıstakoz (tur, Palinurus elephas / sp_083)
 *  - Gambero imperiale (ita, Melicertus kerathurus / sp_020)
 *  - Rödfisk (swe, Sebastes norvegicus / sp_102)
 */
import { Database } from "bun:sqlite";

const db = new Database("fish.db");

console.log("=== Adding confirmed relations and names from notes audit ===\n");

// ── Relations ──────────────────────────────────────────────────────────

const relations = [
	{
		source: "nm_0362",
		target: "nm_0467",
		relation: "borrowed_from",
		notes: "Arabic أنشوفة borrowed from Italian Acciuga via Mediterranean trade",
	},
	{
		source: "nm_0453",
		target: "nm_0474",
		relation: "alternate_of",
		notes: "Both standard English names for Lophius piscatorius",
	},
	{
		source: "nm_0311",
		target: "nm_0308",
		relation: "alternate_of",
		notes: "English and Finnish names for sea-run brown trout",
	},
	{
		source: "nm_0311",
		target: "nm_0309",
		relation: "alternate_of",
		notes: "English and Swedish names for sea-run brown trout",
	},
	{
		source: "nm_0197",
		target: "nm_0011",
		relation: "confused_with",
		notes:
			"Μελανούρι sometimes incorrectly applied to Σκαθάρι (Black seabream) due to similar coloring",
	},
	{
		source: "nm_0394",
		target: "nm_0372",
		relation: "alternate_of",
		notes: "Both Ancient Greek names for Mugil cephalus",
	},
];

const insertRel = db.prepare(
	"INSERT OR IGNORE INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)",
);

for (const r of relations) {
	insertRel.run(r.source, r.target, r.relation, r.notes);
	console.log(`  + ${r.source} ${r.relation} ${r.target}`);
}
console.log(`\nAdded ${relations.length} relations`);

// ── Names ──────────────────────────────────────────────────────────────

const nextIdResult = db
	.query(
		"SELECT MAX(CAST(SUBSTR(id, 4) AS INTEGER)) as max_num FROM names",
	)
	.get() as { max_num: number };
let nextNum = nextIdResult.max_num + 1;

const names = [
	{
		name: "Meriforell",
		species_id: "sp_033",
		region_id: "estonia",
		lang: "est",
		etymology:
			"Compound: meri + forell\nmeri: sea, forell: trout\n↳ forell from German Forelle (trout)",
		transliteration: "Meriforell",
		phonetic: "/ˈmerifoˌrelː/",
	},
	{
		name: "St. Peter's fish",
		species_id: "sp_078",
		region_id: "international",
		lang: "eng",
		etymology:
			"From the legend that the dark spot on the fish is St. Peter's thumbprint",
		transliteration: "St. Peter's fish",
		phonetic: "/seɪnt ˈpiːtəz fɪʃ/",
	},
	{
		name: "Dikenli ıstakoz",
		species_id: "sp_083",
		region_id: "turkish-aegean",
		lang: "tur",
		etymology:
			"Compound: dikenli + ıstakoz\ndikenli: spiny, ıstakoz: lobster\n↳ ıstakoz from Greek αστακός astakós (lobster)",
		transliteration: "Dikenli ıstakoz",
		phonetic: "/diˈkenli ɯstaˈkoz/",
	},
	{
		name: "Gambero imperiale",
		species_id: "sp_020",
		region_id: "italy",
		lang: "ita",
		etymology:
			"Compound: gambero + imperiale\ngambero: prawn/shrimp, imperiale: imperial",
		transliteration: "Gambero imperiale",
		phonetic: "/ˈɡambero impeˈrjaːle/",
	},
	{
		name: "Rödfisk",
		species_id: "sp_102",
		region_id: "sweden",
		lang: "swe",
		etymology: "Compound: röd + fisk\nröd: red, fisk: fish",
		transliteration: "Rödfisk",
		phonetic: "/ˈrøːdˌfɪsk/",
	},
];

const insertName = db.prepare(
	"INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
);

for (const n of names) {
	const id = `nm_${String(nextNum).padStart(4, "0")}`;
	insertName.run(
		id,
		n.name,
		n.species_id,
		n.region_id,
		n.lang,
		n.etymology,
		n.transliteration,
		n.phonetic,
	);
	console.log(`  + ${id}: ${n.name} (${n.lang}, ${n.species_id})`);
	nextNum++;
}
console.log(`\nAdded ${names.length} names`);

// ── Verification ───────────────────────────────────────────────────────

console.log("\n=== Verification ===");

const relCount = db
	.query("SELECT COUNT(*) as cnt FROM name_relations")
	.get() as { cnt: number };
const nameCount = db.query("SELECT COUNT(*) as cnt FROM names").get() as {
	cnt: number;
};
console.log(`Total relations: ${relCount.cnt}`);
console.log(`Total names: ${nameCount.cnt}`);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:validate");

db.close();
