/**
 * Fix sp_022 Penaeus kerathurus scientific name and metadata
 *
 * GitHub Issue: #25
 * Task: TREK-524
 *
 * Problem:
 * - Species sp_022 had outdated scientific name "Penaeus kerathurus"
 * - This caused Wikidata lookup to fail (old name returns Q63708090 with no images/Wikipedia)
 * - Species didn't display images or Wikipedia link in the app
 *
 * Solution:
 * - Updated scientific_name to "Melicertus kerathurus" (current accepted name)
 * - Added family "Penaeidae"
 * - Updated notes with common names and former scientific name
 *
 * The Wikidata entity Q1133806 (Melicertus kerathurus) has:
 * - Image: Langostinos-rafax.JPG
 * - English Wikipedia article
 * - Proper description
 *
 * References:
 * - Wikipedia: https://en.wikipedia.org/wiki/Melicertus_kerathurus
 * - NCBI Taxonomy: https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=71411
 * - FAO: https://www.fao.org/fishery/species/2587/en
 */

import { Database } from "bun:sqlite";

const db = new Database("public/fish.db");

console.log("=== Fix sp_022 Scientific Name ===\n");

// Check current state
const current = db.query("SELECT * FROM species WHERE id = 'sp_022'").get() as {
  id: string;
  scientific_name: string;
  family: string | null;
  notes: string | null;
};

console.log("Current state:");
console.log(`  ID: ${current.id}`);
console.log(`  Scientific name: ${current.scientific_name}`);
console.log(`  Family: ${current.family || "(none)"}`);
console.log(`  Notes: ${current.notes || "(none)"}`);

if (current.scientific_name === "Melicertus kerathurus") {
  console.log("\n Already fixed! No changes needed.");
} else {
  // Apply fix
  db.run(`
    UPDATE species
    SET scientific_name = 'Melicertus kerathurus',
        family = 'Penaeidae',
        notes = 'Caramote prawn / striped prawn. Formerly Penaeus kerathurus.'
    WHERE id = 'sp_022'
  `);
  console.log("\n Applied fix:");
  console.log("  - Scientific name: Melicertus kerathurus");
  console.log("  - Family: Penaeidae");
  console.log("  - Notes updated with common names and former name");
}

db.close();

console.log("\n=== Done ===");
console.log("Run: pnpm db:copy && pnpm db:validate");
