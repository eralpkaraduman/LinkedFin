/**
 * Add European language names for Clupeidae species:
 *  - sp_028 Sardina pilchardus (European pilchard/sardine)
 *  - sp_061 Sprattus sprattus (European sprat)
 *  - sp_062 Engraulis encrasicolus (European anchovy)
 *
 * New regions (if not already present):
 *  - france (France)
 *  - germany (Germany)
 *
 * New names (15 total):
 *  Dutch (nld), French (fra), German (deu), Norwegian (nor), Swedish (swe)
 *  for each of the three species above.
 */
import Database from "better-sqlite3";

const db = new Database("public/fish.db");
db.pragma("journal_mode = WAL");

console.log("=== Adding European names for Clupeidae species ===\n");

// ── Regions ────────────────────────────────────────────────────────────

const existingRegions = db
	.prepare("SELECT id FROM regions WHERE id IN ('france', 'germany')")
	.all()
	.map((r: any) => r.id) as string[];

if (!existingRegions.includes("france")) {
	db.prepare("INSERT INTO regions (id, name) VALUES ('france', 'France')").run();
	console.log("Added region: france (France)");
} else {
	console.log("Region france already exists, skipping");
}

if (!existingRegions.includes("germany")) {
	db.prepare("INSERT INTO regions (id, name) VALUES ('germany', 'Germany')").run();
	console.log("Added region: germany (Germany)");
} else {
	console.log("Region germany already exists, skipping");
}

// ── Determine starting ID ─────────────────────────────────────────────

const maxResult = db
	.prepare("SELECT MAX(CAST(SUBSTR(id, 4) AS INTEGER)) as max_num FROM names")
	.get() as { max_num: number };

// Use max + 20 buffer (minimum 520) to avoid conflicts with concurrent agents
const startNum = Math.max(maxResult.max_num + 20, 520);
let nextNum = startNum;

function nextId(): string {
	const id = `nm_${String(nextNum).padStart(4, "0")}`;
	nextNum++;
	return id;
}

console.log(`\nStarting name IDs from nm_${String(startNum).padStart(4, "0")} (max was nm_${String(maxResult.max_num).padStart(4, "0")})\n`);

// ── Names ──────────────────────────────────────────────────────────────

const insertName = db.prepare(`
	INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const names: {
	name: string;
	species_id: string;
	region_id: string;
	lang: string;
	etymology: string;
	transliteration: string;
	phonetic: string;
}[] = [
	// ── sp_028 Sardina pilchardus ──────────────────────────────────────
	{
		name: "Sardien",
		species_id: "sp_028",
		region_id: "netherlands",
		lang: "nld",
		etymology:
			"From French sardine, from Latin sardina\n↳ From Greek Σαρδίνη Sardínē (Sardinia), where the fish was once abundant",
		transliteration: "Sardien",
		phonetic: "/sɑrˈdin/",
	},
	{
		name: "Sardine",
		species_id: "sp_028",
		region_id: "france",
		lang: "fra",
		etymology:
			"From Latin sardina, from Greek Σαρδίνη Sardínē (Sardinia)\n↳ Named after the island of Sardinia, where large shoals were historically found",
		transliteration: "Sardine",
		phonetic: "/saʁ.din/",
	},
	{
		name: "Sardine",
		species_id: "sp_028",
		region_id: "germany",
		lang: "deu",
		etymology:
			"From Latin sardina, via French sardine\n↳ From Greek Σαρδίνη Sardínē (Sardinia), referring to the island where the fish was plentiful",
		transliteration: "Sardine",
		phonetic: "/zaʁˈdiːnə/",
	},
	{
		name: "Sardin",
		species_id: "sp_028",
		region_id: "norway",
		lang: "nor",
		etymology:
			"From French sardine, from Latin sardina\n↳ From Greek Σαρδίνη Sardínē (Sardinia)",
		transliteration: "Sardin",
		phonetic: "/sɑrˈdiːn/",
	},
	{
		name: "Sardin",
		species_id: "sp_028",
		region_id: "sweden",
		lang: "swe",
		etymology:
			"From French sardine, from Latin sardina\n↳ From Greek Σαρδίνη Sardínē (Sardinia)",
		transliteration: "Sardin",
		phonetic: "/sarˈdiːn/",
	},

	// ── sp_061 Sprattus sprattus ───────────────────────────────────────
	{
		name: "Sprot",
		species_id: "sp_061",
		region_id: "netherlands",
		lang: "nld",
		etymology:
			"From Middle Dutch sprot\n↳ From Proto-Germanic *sprut- (sprout), referring to the small size of the fish",
		transliteration: "Sprot",
		phonetic: "/sprɔt/",
	},
	{
		name: "Sprat",
		species_id: "sp_061",
		region_id: "france",
		lang: "fra",
		etymology:
			"Borrowed from English sprat\n↳ From Old English sprott, from Proto-Germanic *sprut- (sprout), describing the fish's small size",
		transliteration: "Sprat",
		phonetic: "/spʁat/",
	},
	{
		name: "Sprotte",
		species_id: "sp_061",
		region_id: "germany",
		lang: "deu",
		etymology:
			"From Low German Sprotte\n↳ From Proto-Germanic *sprut- (sprout), referring to the small, slender fish",
		transliteration: "Sprotte",
		phonetic: "/ˈʃpʁɔtə/",
	},
	{
		name: "Brisling",
		species_id: "sp_061",
		region_id: "norway",
		lang: "nor",
		etymology:
			"From Norwegian brisling, meaning 'small herring'\n↳ Possibly related to Old Norse brisa (to swell), referring to the silvery scales",
		transliteration: "Brisling",
		phonetic: "/ˈbrɪslɪŋ/",
	},
	{
		name: "Vassbuk",
		species_id: "sp_061",
		region_id: "sweden",
		lang: "swe",
		etymology:
			"Compound: vass (sharp) + buk (belly)\n↳ Referring to the sprat's sharp-keeled belly, a distinguishing feature of the species",
		transliteration: "Vassbuk",
		phonetic: "/ˈvasːbɵk/",
	},

	// ── sp_062 Engraulis encrasicolus ──────────────────────────────────
	{
		name: "Ansjovis",
		species_id: "sp_062",
		region_id: "netherlands",
		lang: "nld",
		etymology:
			"From Spanish anchoa, via Portuguese anchova\n↳ Ultimately from Basque antzua (dried fish) or Latin apiuva (small fish)",
		transliteration: "Ansjovis",
		phonetic: "/ɑnˈʃoːvɪs/",
	},
	{
		name: "Anchois",
		species_id: "sp_062",
		region_id: "france",
		lang: "fra",
		etymology:
			"From Spanish anchoa, from Basque antzua (dried fish)\n↳ Or possibly from Late Latin apiuva, from Greek ἀφύη aphýē (anchovy)",
		transliteration: "Anchois",
		phonetic: "/ɑ̃.ʃwa/",
	},
	{
		name: "Sardelle",
		species_id: "sp_062",
		region_id: "germany",
		lang: "deu",
		etymology:
			"From Italian sardella, diminutive of sarda (sardine)\n↳ From Latin sardina, reflecting the anchovy's resemblance to a small sardine",
		transliteration: "Sardelle",
		phonetic: "/zaʁˈdɛlə/",
	},
	{
		name: "Ansjos",
		species_id: "sp_062",
		region_id: "norway",
		lang: "nor",
		etymology:
			"From Dutch ansjovis or German Anschovis\n↳ Ultimately from Spanish anchoa, from Basque antzua (dried fish)",
		transliteration: "Ansjos",
		phonetic: "/ɑnˈʃuːs/",
	},
	{
		name: "Sardell",
		species_id: "sp_062",
		region_id: "sweden",
		lang: "swe",
		etymology:
			"From Italian sardella, diminutive of sarda (sardine)\n↳ From Latin sardina; in Sweden, sardell traditionally refers to spiced sprat, but also denotes the true anchovy",
		transliteration: "Sardell",
		phonetic: "/sarˈdɛlː/",
	},
];

// sp_060 Alosa pontica (Pontic shad) — skipped. This species is endemic to
// the Black Sea and Sea of Azov. It has no established common names in Dutch,
// French, German, Norwegian, or Swedish, as the fish is not found in those
// waters and has no commercial or cultural presence in those languages.

console.log("Adding names...");

const insertMany = db.transaction(() => {
	for (const n of names) {
		const id = nextId();
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
		console.log(`  ${id}: ${n.name} (${n.lang}, ${n.species_id})`);
	}
});

insertMany();

// ── Verification ───────────────────────────────────────────────────────

console.log("\n=== Verification ===");

const speciesCheck = db
	.prepare(`
		SELECT s.scientific_name, COUNT(n.id) as name_count
		FROM species s JOIN names n ON s.id = n.species_id
		WHERE s.id IN ('sp_028', 'sp_061', 'sp_062')
		GROUP BY s.id
	`)
	.all() as { scientific_name: string; name_count: number }[];

for (const s of speciesCheck) {
	console.log(`  ${s.scientific_name}: ${s.name_count} names`);
}

const totalNames = db
	.prepare("SELECT COUNT(*) as cnt FROM names")
	.get() as { cnt: number };
const totalRegions = db
	.prepare("SELECT COUNT(*) as cnt FROM regions")
	.get() as { cnt: number };
console.log(`\nTotal: ${totalNames.cnt} names, ${totalRegions.cnt} regions`);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:validate");

db.close();
