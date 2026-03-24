/**
 * Add missing relations and new Greek names.
 *
 * Relations (3):
 *  - nm_0480 (Müren balığı, Turkish) borrowed_from nm_0388 (μύραινα, Ancient Greek)
 *  - nm_0488 (Makrilli, Finnish, sp_056) confused_with nm_0489 (Makrilli, Finnish, sp_081)
 *  - nm_0493 (Σκουμπρί, Greek) borrowed_from nm_0369 (σκόμβρος, Ancient Greek)
 *
 * Names (2):
 *  - Σκουμπρί (ell, Scomber scombrus / sp_081)
 *  - Πριονόψαρο (ell, Pristis pristis / sp_103)
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Adding missing relations and Greek names ===\n");

// ── New names ─────────────────────────────────────────────────────────

const nextIdResult = db
	.query(
		"SELECT MAX(CAST(SUBSTR(id, 4) AS INTEGER)) as max_num FROM names",
	)
	.get() as { max_num: number };
let nextNum = nextIdResult.max_num + 1;

const names = [
	{
		name: "Σκουμπρί",
		species_id: "sp_081",
		region_id: "greek",
		lang: "ell",
		etymology:
			"From Ancient Greek σκόμβρος (skómbros, mackerel)\n↳ σκόμβρος possibly from pre-Greek substrate",
		transliteration: "Skoumbrí",
		phonetic: "/skuˈbri/",
	},
	{
		name: "Πριονόψαρο",
		species_id: "sp_103",
		region_id: "greek",
		lang: "ell",
		etymology:
			"Compound: πριόνι + ψάρι\nprióni: saw, psári: fish\n↳ πριόνι from Ancient Greek πρίων (príōn, saw)",
		transliteration: "Prionópsaro",
		phonetic: "/prioˈnopsaro/",
	},
];

const insertName = db.prepare(
	"INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
);

const nameIds: string[] = [];
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
	nameIds.push(id);
	nextNum++;
}
console.log(`\nAdded ${names.length} names`);

// ── Relations ─────────────────────────────────────────────────────────

const relations = [
	{
		source: "nm_0480",
		target: "nm_0388",
		relation: "borrowed_from",
		notes: "Turkish müren from Latin mūraena, from Ancient Greek μύραινα",
	},
	{
		source: "nm_0488",
		target: "nm_0489",
		relation: "confused_with",
		notes:
			"Same Finnish name 'Makrilli' used for both Scomber colias (sp_056) and Scomber scombrus (sp_081)",
	},
	{
		source: nameIds[0], // Σκουμπρί
		target: "nm_0369",
		relation: "borrowed_from",
		notes:
			"Modern Greek σκουμπρί from Ancient Greek σκόμβρος (skómbros)",
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

// ── Verification ──────────────────────────────────────────────────────

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
