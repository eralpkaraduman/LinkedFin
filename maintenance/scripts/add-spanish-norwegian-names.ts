/**
 * Add Spain and Norway regions, then add Lecha (Spanish) and Uer (Norwegian).
 *
 * New regions:
 *  - spain (Spain)
 *  - norway (Norway)
 *
 * New names:
 *  - Lecha (spa, Lichia amia / sp_085)
 *  - Uer (nor, Sebastes norvegicus / sp_102)
 *
 * New relations:
 *  - Lecha borrowed_from Leccia (nm_0463)
 *  - Uer alternate_of Rödfisk (nm_0485)
 *  - Uer alternate_of Större kungsfisk (nm_0471)
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Adding Spain/Norway regions and names ===\n");

// ── Regions ────────────────────────────────────────────────────────────

db.run("INSERT INTO regions (id, name) VALUES ('spain', 'Spain')");
db.run("INSERT INTO regions (id, name) VALUES ('norway', 'Norway')");
console.log("Added regions: spain, norway");

// ── Names ──────────────────────────────────────────────────────────────

const nextIdResult = db
	.query(
		"SELECT MAX(CAST(SUBSTR(id, 4) AS INTEGER)) as max_num FROM names",
	)
	.get() as { max_num: number };
let nextNum = nextIdResult.max_num + 1;

const lechaId = `nm_${String(nextNum).padStart(4, "0")}`;
nextNum++;
const uerId = `nm_${String(nextNum).padStart(4, "0")}`;

db.run(
	"INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
	[
		lechaId,
		"Lecha",
		"sp_085",
		"spain",
		"spa",
		"From Italian leccia (leerfish)\n↳ From Latin lichia, of uncertain origin",
		"Lecha",
		"/ˈletʃa/",
	],
);
console.log(`Added ${lechaId}: Lecha (spa, sp_085)`);

db.run(
	"INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
	[
		uerId,
		"Uer",
		"sp_102",
		"norway",
		"nor",
		"From Old Norse, of uncertain origin\n↳ Possibly related to úr (drizzle/moisture)",
		"Uer",
		"/ˈʉːər/",
	],
);
console.log(`Added ${uerId}: Uer (nor, sp_102)`);

// ── Relations ──────────────────────────────────────────────────────────

const insertRel = db.prepare(
	"INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)",
);

// Lecha borrowed from Italian Leccia
insertRel.run(
	lechaId,
	"nm_0463",
	"borrowed_from",
	"Spanish Lecha borrowed from Italian Leccia",
);
console.log(`Added relation: ${lechaId} (Lecha) borrowed_from nm_0463 (Leccia)`);

// Uer alternate of Swedish names (same species, Scandinavian names)
insertRel.run(
	uerId,
	"nm_0485",
	"alternate_of",
	"Norwegian and Swedish names for Sebastes norvegicus",
);
console.log(`Added relation: ${uerId} (Uer) alternate_of nm_0485 (Rödfisk)`);

insertRel.run(
	uerId,
	"nm_0471",
	"alternate_of",
	"Norwegian and Swedish names for Sebastes norvegicus",
);
console.log(
	`Added relation: ${uerId} (Uer) alternate_of nm_0471 (Större kungsfisk)`,
);

// ── Verification ───────────────────────────────────────────────────────

console.log("\n=== Verification ===");
const regionCount = db
	.query("SELECT COUNT(*) as cnt FROM regions")
	.get() as { cnt: number };
const nameCount = db.query("SELECT COUNT(*) as cnt FROM names").get() as {
	cnt: number;
};
const relCount = db
	.query("SELECT COUNT(*) as cnt FROM name_relations")
	.get() as { cnt: number };
console.log(`Regions: ${regionCount.cnt}, Names: ${nameCount.cnt}, Relations: ${relCount.cnt}`);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:validate");

db.close();
