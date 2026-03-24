/**
 * Add Punasimppu (Golden redfish / Sebastes norvegicus)
 *
 * Source: https://fi.wikipedia.org/wiki/Punasimppu
 *
 * Names:
 * - Finnish: Punasimppu (red sculpin)
 * - Swedish: Större kungsfisk (larger kingfish)
 * - English: Golden redfish
 */
import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Adding Punasimppu (Sebastes norvegicus) ===\n");

// 1. Add species
const speciesId = "sp_102";
console.log(`1. Adding species: Sebastes norvegicus (${speciesId})`);

db.run(`
	INSERT INTO species (id, scientific_name, family, habitat, notes)
	VALUES (?, 'Sebastes norvegicus', 'Sebastidae', 'marine', 'Also known as rose fish, ocean perch. Deep-water species found in North Atlantic.')
`, [speciesId]);
console.log("   ✓ Added species");

// 2. Add Finnish name: Punasimppu
const finnishId = "nm_0470";
console.log(`\n2. Adding Finnish name: Punasimppu (${finnishId})`);

db.run(`
	INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
	VALUES (?, 'Punasimppu', ?, 'finland', 'fin',
		'Compound: puna + simppu
puna: red, simppu: sculpin (from Swedish)',
		'Punasimppu', '/ˈpunɑˌsimpːu/',
		'Also called puna-ahven (red perch)')
`, [finnishId, speciesId]);
console.log("   ✓ Added Punasimppu");

// 3. Add Swedish name: Större kungsfisk
const swedishId = "nm_0471";
console.log(`\n3. Adding Swedish name: Större kungsfisk (${swedishId})`);

db.run(`
	INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
	VALUES (?, 'Större kungsfisk', ?, 'sweden', 'swe',
		'Compound: större + kungs + fisk
större: larger, kung: king, fisk: fish',
		'Storre kungsfisk', '/ˈstœrːeˌkɵŋsfɪsk/',
		'Literally "larger kingfish". Also called rödfisk (redfish) or uer.')
`, [swedishId, speciesId]);
console.log("   ✓ Added Större kungsfisk");

// 4. Add English name: Golden redfish
const englishId = "nm_0472";
console.log(`\n4. Adding English name: Golden redfish (${englishId})`);

db.run(`
	INSERT INTO names (id, name, species_id, region_id, lang, etymology, transliteration, phonetic, notes)
	VALUES (?, 'Golden redfish', ?, 'international', 'eng',
		'Descriptive: from its golden-red coloration',
		'Golden redfish', '/ˈɡoʊldən ˈrɛdfɪʃ/',
		'Also called rose fish, ocean perch, Norway haddock')
`, [englishId, speciesId]);
console.log("   ✓ Added Golden redfish");

// 5. Add relations
console.log("\n5. Adding relations...");

db.run(`
	INSERT INTO name_relations (source_id, target_id, relation, notes)
	VALUES (?, ?, 'alternate_of', 'Finnish ↔ Swedish equivalent')
`, [finnishId, swedishId]);
console.log("   ✓ Punasimppu ↔ Större kungsfisk (alternate_of)");

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:validate");

db.close();
