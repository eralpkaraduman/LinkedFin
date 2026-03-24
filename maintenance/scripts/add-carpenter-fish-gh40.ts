/**
 * Add carpenter fish (sawfish) species and names
 *
 * GitHub Issue #40: https://github.com/eralpkaraduman/LinkedFin/issues/40
 *
 * Species:
 *  - sp_103: Pristis pristis (largetooth sawfish / common sawfish)
 *
 * Names:
 *  - nm_0490: Marangoz balığı (Turkish, "carpenter fish")
 *  - nm_0491: Testere balığı (Turkish, "saw fish")
 *  - nm_0492: Largetooth sawfish (English)
 *
 * References:
 *  - https://en.wikipedia.org/wiki/Carpenter_fish
 *  - https://en.wiktionary.org/wiki/marangoz_balığı
 *  - https://evrimagaci.org/testere-baligi-nedir-testere-kopekbaliklarinin-testereleri-ne-ise-yarar-10309
 */
import Database from "better-sqlite3";

const db = new Database("fish.db");

console.log("=== Adding carpenter fish species and names (Issue #40) ===\n");

// ── Species ──────────────────────────────────────────────────────────

db.prepare(
	"INSERT INTO species (id, scientific_name, notes) VALUES (?, ?, ?)",
).run(
	"sp_103",
	"Pristis pristis",
	"Largetooth sawfish (family Pristidae). Critically endangered ray with distinctive saw-like rostrum. Found in tropical/subtropical coastal and freshwater habitats.",
);
console.log("Added sp_103: Pristis pristis");

// ── Names ────────────────────────────────────────────────────────────

const insertName = db.prepare(`
	INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic)
	VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertName.run(
	"nm_0490",
	"Marangoz balığı",
	"sp_103",
	"turkish-aegean",
	"tur",
	"Compound: marangoz + balığı\nmarangoz: carpenter, from Italian marangone (shipwright, diver)\n↳ From Venetian marangon (carpenter)\nbalığı: its fish\n↳ Refers to the saw-like rostrum resembling a carpenter's saw",
	"Marangoz baligi",
	"/maɾanˈɡoz baˈlɯːɯ/",
);
console.log("Added nm_0490: Marangoz balığı (Turkish)");

insertName.run(
	"nm_0491",
	"Testere balığı",
	"sp_103",
	"turkish-aegean",
	"tur",
	"Compound: testere + balığı\ntestere: saw, from Persian تسره testere (saw)\nbalığı: its fish\n↳ Describes the saw-toothed rostrum",
	"Testere baligi",
	"/testeˈɾe baˈlɯːɯ/",
);
console.log("Added nm_0491: Testere balığı (Turkish)");

insertName.run(
	"nm_0492",
	"Largetooth sawfish",
	"sp_103",
	"international",
	"eng",
	"Compound: largetooth + sawfish\nlargetooth: describes the large rostral teeth\nsawfish: from the saw-like rostrum lined with teeth",
	"Largetooth sawfish",
	"/ˈlɑːrdʒtuːθ ˈsɔːfɪʃ/",
);
console.log("Added nm_0492: Largetooth sawfish (English)");

// ── Relations ────────────────────────────────────────────────────────

db.prepare(
	"INSERT INTO name_relations (source_id, target_id, relation, notes) VALUES (?, ?, ?, ?)",
).run(
	"nm_0490",
	"nm_0491",
	"alternate_of",
	"Both Turkish names for Pristis pristis: marangoz (carpenter) and testere (saw) refer to the same rostrum feature",
);
console.log("Added relation: nm_0490 alternate_of nm_0491");

// ── Verification ─────────────────────────────────────────────────────

console.log("\n=== Verification ===");

const species = db
	.prepare("SELECT * FROM species WHERE id = 'sp_103'")
	.get() as { id: string; scientific_name: string; notes: string };
console.log(`\nSpecies: ${species.id} - ${species.scientific_name}`);
console.log(`  Notes: ${species.notes}`);

const names = db
	.prepare("SELECT id, name, lang, region_id, etymology FROM names WHERE species_id = 'sp_103'")
	.all() as { id: string; name: string; lang: string; region_id: string; etymology: string }[];

for (const n of names) {
	console.log(`\n${n.id} (${n.lang}, ${n.region_id}): ${n.name}`);
	console.log(`  Etymology: ${n.etymology}`);
}

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy");

db.close();
