/**
 * Rename "dutch" region to "netherlands" for naming consistency.
 *
 * Other regions use country/place names (estonia, finland, norway, italy, etc.)
 * but "dutch" is a demonym. Rename to "netherlands" to match the convention.
 *
 * Steps:
 * 1. Insert new region "netherlands" with name "Netherlands"
 * 2. Update all names with region_id='dutch' to region_id='netherlands'
 * 3. Delete old region "dutch"
 */
import Database from "better-sqlite3";

const db = new Database("public/fish.db");

console.log("=== Renaming dutch region to netherlands ===\n");

// Show current state
const affectedNames = db
	.prepare("SELECT id, name, region_id FROM names WHERE region_id = 'dutch'")
	.all() as { id: string; name: string; region_id: string }[];
console.log(`Names with region_id='dutch': ${affectedNames.length}`);
for (const n of affectedNames) {
	console.log(`  ${n.id}: ${n.name} (region: ${n.region_id})`);
}

// Run migration in a transaction
db.transaction(() => {
	// 1. Insert new region
	db.prepare(
		"INSERT INTO regions (id, name) VALUES ('netherlands', 'Netherlands')",
	).run();
	console.log("\nInserted region: netherlands (Netherlands)");

	// 2. Update names
	const result = db
		.prepare(
			"UPDATE names SET region_id = 'netherlands' WHERE region_id = 'dutch'",
		)
		.run();
	console.log(`Updated ${result.changes} name(s) from dutch to netherlands`);

	// 3. Delete old region
	db.prepare("DELETE FROM regions WHERE id = 'dutch'").run();
	console.log("Deleted region: dutch");
})();

// Verify
console.log("\n=== Verification ===");
const oldRegion = db
	.prepare("SELECT * FROM regions WHERE id = 'dutch'")
	.get();
console.log(`Region 'dutch' exists: ${oldRegion !== undefined}`);

const newRegion = db
	.prepare("SELECT * FROM regions WHERE id = 'netherlands'")
	.get() as { id: string; name: string } | undefined;
console.log(
	`Region 'netherlands' exists: ${newRegion !== undefined} (name: ${newRegion?.name})`,
);

const updatedNames = db
	.prepare(
		"SELECT id, name, region_id FROM names WHERE region_id = 'netherlands'",
	)
	.all() as { id: string; name: string; region_id: string }[];
console.log(`Names with region_id='netherlands': ${updatedNames.length}`);
for (const n of updatedNames) {
	console.log(`  ${n.id}: ${n.name} (region: ${n.region_id})`);
}

console.log("\n=== Done! ===");
console.log("Run: pnpm db:copy && pnpm db:validate");

db.close();
