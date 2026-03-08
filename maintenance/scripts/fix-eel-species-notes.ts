/**
 * Fix sp_018 (European eel) species notes
 *
 * GitHub Issue #24: https://github.com/eralpkaraduman/LinkedFin/issues/24
 *
 * Problem:
 * - "Pure Turkish name" is incorrect - Yılan comes from Old Turkish (pre-900 CE)
 * - "Catadromous" info is accurate biology but unrelated to naming
 *
 * Solution:
 * - Remove "Pure Turkish name" (factually wrong)
 * - Keep catadromous info as it's accurate species biology
 */
import { Database } from "bun:sqlite";

const db = new Database("fish.db");

console.log("=== Fixing sp_018 (European eel) species notes ===\n");

// Show current state
const current = db.query("SELECT * FROM species WHERE id = 'sp_018'").get() as {
	id: string;
	scientific_name: string;
	notes: string;
};
console.log("Current notes:", current.notes);

// Update to remove incorrect "Pure Turkish name"
db.run(`
	UPDATE species
	SET notes = 'Catadromous - lives in freshwater rivers/lakes, migrates to sea to breed in Sargasso Sea.'
	WHERE id = 'sp_018'
`);

// Verify update
const updated = db.query("SELECT notes FROM species WHERE id = 'sp_018'").get() as {
	notes: string;
};
console.log("\nUpdated notes:", updated.notes);

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:validate");

db.close();
