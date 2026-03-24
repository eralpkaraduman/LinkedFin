/**
 * Add Clupea harengus (Atlantic herring) as a new species with names in
 * multiple European languages.
 *
 * New species:
 *  - sp_104: Clupea harengus (Clupeidae)
 *
 * New regions:
 *  - france (France)
 *  - germany (Germany)
 *  - denmark (Denmark)
 *  - poland (Poland)
 *
 * New names:
 *  - Atlantic herring (eng, international)
 *  - Haring (nld, netherlands)
 *  - Hareng (fra, france)
 *  - Hering (deu, germany)
 *  - Sild (nor, norway)
 *  - Sild (dan, denmark)
 *  - Sill (swe, sweden)
 *  - Ringa (tur, turkish-aegean)
 *  - Ρέγγα (ell, greek)
 *  - Śledź (pol, poland)
 *
 * New relations:
 *  - Ringa (Turkish) borrowed_from Ρέγγα (Greek)
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Adding Clupea harengus (Atlantic herring) ===\n");

// ── Species ───────────────────────────────────────────────────────────

const spIdResult = db
	.query(
		"SELECT MAX(CAST(SUBSTR(id, 4) AS INTEGER)) as max_num FROM species",
	)
	.get() as { max_num: number };
const spId = `sp_${String(spIdResult.max_num + 1).padStart(3, "0")}`;

db.run("INSERT INTO species (id, scientific_name, notes) VALUES (?, ?, ?)", [
	spId,
	"Clupea harengus",
	"Atlantic herring. One of the most abundant fish species. Schooling pelagic fish found in temperate waters of the North Atlantic. Grows to 45cm. Commercially one of the most important fish species in the world.",
]);
console.log(`Added species ${spId}: Clupea harengus`);

// ── Regions ───────────────────────────────────────────────────────────

const existingRegions = new Set(
	(
		db.query("SELECT id FROM regions").all() as { id: string }[]
	).map((r) => r.id),
);

const newRegions = [
	["france", "France"],
	["germany", "Germany"],
	["denmark", "Denmark"],
	["poland", "Poland"],
];

for (const [id, name] of newRegions) {
	if (!existingRegions.has(id)) {
		db.run("INSERT INTO regions (id, name) VALUES (?, ?)", [id, name]);
		console.log(`Added region: ${id} (${name})`);
	} else {
		console.log(`Region already exists: ${id}`);
	}
}

// ── Names ─────────────────────────────────────────────────────────────

const nextIdResult = db
	.query(
		"SELECT MAX(CAST(SUBSTR(id, 4) AS INTEGER)) as max_num FROM names",
	)
	.get() as { max_num: number };
let nextNum = nextIdResult.max_num + 1;

function nextNameId(): string {
	const id = `nm_${String(nextNum).padStart(4, "0")}`;
	nextNum++;
	return id;
}

const insertName = db.prepare(
	"INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
);

// 1. Atlantic herring (eng, international)
const atlanticHerringId = nextNameId();
insertName.run(
	atlanticHerringId,
	"Atlantic herring",
	spId,
	"international",
	"eng",
	"Atlantic: from Latin Atlanticus, from Greek Ἀτλαντικός (Atlantikós, of Atlas)\n↳ Ἄτλας (Átlas), the Titan who held up the sky, after whom the Atlantic Ocean is named\nherring: from Old English hǣring\n↳ From Proto-Germanic *hēringaz, possibly related to *hēra- (gray, silvery), describing the fish's shimmering appearance",
	"Atlantic herring",
	"/ətˈlæntɪk ˈhɛɹɪŋ/",
);
console.log(`Added ${atlanticHerringId}: Atlantic herring (eng, international)`);

// 2. Haring (nld, netherlands)
const haringId = nextNameId();
insertName.run(
	haringId,
	"Haring",
	spId,
	"netherlands",
	"nld",
	"From Middle Dutch hārinc\n↳ From Proto-Germanic *hēringaz, possibly related to *hēra- (gray, silvery), describing the fish's shimmering appearance",
	"Haring",
	"/ˈɦaːrɪŋ/",
);
console.log(`Added ${haringId}: Haring (nld, netherlands)`);

// 3. Hareng (fra, france)
const harengId = nextNameId();
insertName.run(
	harengId,
	"Hareng",
	spId,
	"france",
	"fra",
	"From Old French harenc\n↳ From Frankish *hāring, from Proto-Germanic *hēringaz, possibly related to *hēra- (gray, silvery)",
	"Hareng",
	"/a.ʁɑ̃/",
);
console.log(`Added ${harengId}: Hareng (fra, france)`);

// 4. Hering (deu, germany)
const heringId = nextNameId();
insertName.run(
	heringId,
	"Hering",
	spId,
	"germany",
	"deu",
	"From Middle High German hærinc\n↳ From Old High German hāring, from Proto-Germanic *hēringaz, possibly related to *hēra- (gray, silvery)",
	"Hering",
	"/ˈheːʁɪŋ/",
);
console.log(`Added ${heringId}: Hering (deu, germany)`);

// 5. Sild (nor, norway)
const sildNorId = nextNameId();
insertName.run(
	sildNorId,
	"Sild",
	spId,
	"norway",
	"nor",
	"From Old Norse síld\n↳ From Proto-Germanic *sīlą (herring), of uncertain further etymology",
	"Sild",
	"/sɪlː/",
);
console.log(`Added ${sildNorId}: Sild (nor, norway)`);

// 6. Sild (dan, denmark)
const sildDanId = nextNameId();
insertName.run(
	sildDanId,
	"Sild",
	spId,
	"denmark",
	"dan",
	"From Old Norse síld\n↳ From Proto-Germanic *sīlą (herring), of uncertain further etymology",
	"Sild",
	"/silˀ/",
);
console.log(`Added ${sildDanId}: Sild (dan, denmark)`);

// 7. Sill (swe, sweden)
const sillId = nextNameId();
insertName.run(
	sillId,
	"Sill",
	spId,
	"sweden",
	"swe",
	"From Old Norse síld\n↳ From Proto-Germanic *sīlą (herring), of uncertain further etymology",
	"Sill",
	"/sɪlː/",
);
console.log(`Added ${sillId}: Sill (swe, sweden)`);

// 8. Ringa (tur, turkish-aegean)
const ringaId = nextNameId();
insertName.run(
	ringaId,
	"Ringa",
	spId,
	"turkish-aegean",
	"tur",
	"From Greek ρέγγα (rénga, herring)\n↳ From Medieval Latin arenga/harenga, from Proto-Germanic *hēringaz",
	"Ringa",
	"/ˈɾinɡa/",
);
console.log(`Added ${ringaId}: Ringa (tur, turkish-aegean)`);

// 9. Ρέγγα (ell, greek)
const rengaId = nextNameId();
insertName.run(
	rengaId,
	"Ρέγγα",
	spId,
	"greek",
	"ell",
	"From Medieval Latin arenga/harenga\n↳ From Proto-Germanic *hēringaz, possibly related to *hēra- (gray, silvery)",
	"Rénga",
	"/ˈreŋɡa/",
);
console.log(`Added ${rengaId}: Ρέγγα (ell, greek)`);

// 10. Śledź (pol, poland)
const sledzId = nextNameId();
insertName.run(
	sledzId,
	"Śledź",
	spId,
	"poland",
	"pol",
	"From Proto-Slavic *selьdь (herring)\n↳ Of uncertain further etymology, possibly a pre-Slavic substrate word or an early borrowing",
	"Śledź",
	"/ɕlɛt͡ɕ/",
);
console.log(`Added ${sledzId}: Śledź (pol, poland)`);

// ── Relations ─────────────────────────────────────────────────────────
// Turkish "Ringa" is borrowed from Greek "Ρέγγα" (rénga).
// The Greek word entered Turkish through trade contact in the Eastern
// Mediterranean. The borrowing direction is Greek → Turkish.

db.run(
	"INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)",
	[
		ringaId,
		rengaId,
		"borrowed_from",
		"Turkish ringa borrowed from Greek ρέγγα (rénga), both ultimately from Germanic *hēringaz via Medieval Latin",
	],
);
console.log(
	`Added relation: ${ringaId} (Ringa) borrowed_from ${rengaId} (Ρέγγα)`,
);

// ── Verification ──────────────────────────────────────────────────────

console.log("\n=== Verification ===");
const speciesCount = db
	.query("SELECT COUNT(*) as cnt FROM species")
	.get() as { cnt: number };
const regionCount = db
	.query("SELECT COUNT(*) as cnt FROM regions")
	.get() as { cnt: number };
const nameCount = db.query("SELECT COUNT(*) as cnt FROM names").get() as {
	cnt: number;
};
const relCount = db
	.query("SELECT COUNT(*) as cnt FROM name_relations")
	.get() as { cnt: number };
console.log(
	`Species: ${speciesCount.cnt}, Regions: ${regionCount.cnt}, Names: ${nameCount.cnt}, Relations: ${relCount.cnt}`,
);

const newNames = db
	.query("SELECT id, name, lang, region_id FROM names WHERE species_id = ?")
	.all(spId) as { id: string; name: string; lang: string; region_id: string }[];
console.log(`\nNames for ${spId} (Clupea harengus):`);
for (const n of newNames) {
	console.log(`  ${n.id}: ${n.name} (${n.lang}, ${n.region_id})`);
}

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:validate");

db.close();
