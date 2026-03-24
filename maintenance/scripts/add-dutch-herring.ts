/**
 * Add Netherlands region and Dutch herring name for Baltic herring (sp_040).
 *
 * New region:
 *  - dutch (Netherlands)
 *
 * New names:
 *  - Haring (nld, Clupea harengus membras / sp_040)
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Adding Dutch region and herring name ===\n");

// ── Region ─────────────────────────────────────────────────────────────

db.run("INSERT INTO regions (id, name) VALUES ('dutch', 'Netherlands')");
console.log("Added region: dutch (Netherlands)");

// ── Names ──────────────────────────────────────────────────────────────

const nextIdResult = db
	.query(
		"SELECT MAX(CAST(SUBSTR(id, 4) AS INTEGER)) as max_num FROM names",
	)
	.get() as { max_num: number };
let nextNum = nextIdResult.max_num + 1;

const haringId = `nm_${String(nextNum).padStart(4, "0")}`;

db.run(
	"INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
	[
		haringId,
		"Haring",
		"sp_040",
		"dutch",
		"nld",
		"From Middle Dutch hārinc\n↳ From Proto-Germanic *hēringaz, possibly related to *hēra- (gray, silvery), describing the fish's appearance",
		"Haring",
		"/ˈɦaːrɪŋ/",
	],
);
console.log(`Added ${haringId}: Haring (nld, sp_040)`);

// ── Verification ───────────────────────────────────────────────────────

console.log("\n=== Verification ===");
const regionCount = db
	.query("SELECT COUNT(*) as cnt FROM regions")
	.get() as { cnt: number };
const nameCount = db.query("SELECT COUNT(*) as cnt FROM names").get() as {
	cnt: number;
};
console.log(`Regions: ${regionCount.cnt}, Names: ${nameCount.cnt}`);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:validate");

db.close();
