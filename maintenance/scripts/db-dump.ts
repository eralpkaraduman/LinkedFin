import Database from "better-sqlite3";

const db = new Database("fish.db", { readonly: true });

function quote(val: unknown): string {
	if (val === null) return "NULL";
	if (typeof val === "number") return String(val);
	return `'${String(val).replace(/'/g, "''")}'`;
}

function dumpTable(name: string) {
	const rows = db.prepare(`SELECT * FROM "${name}"`).all();
	for (const row of rows) {
		const vals = Object.values(row).map(quote).join(",");
		console.log(`INSERT INTO "${name}" VALUES(${vals});`);
	}
}

// Drop in reverse dependency order
console.log("PRAGMA foreign_keys=OFF;");
console.log("DROP TABLE IF EXISTS name_relations;");
console.log("DROP TABLE IF EXISTS names;");
console.log("DROP TABLE IF EXISTS regions;");
console.log("DROP TABLE IF EXISTS species;");

// Schema
const tables = db
	.prepare("SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name")
	.all() as { sql: string }[];
for (const t of tables) {
	console.log(`${t.sql};`);
}

// Data in dependency order
dumpTable("species");
dumpTable("regions");
dumpTable("names");
dumpTable("name_relations");

db.close();
