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

// Discover all tables
const tables = db
	.prepare(
		"SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
	)
	.all() as { name: string; sql: string }[];

// Disable FK checks so drop/insert order doesn't matter
console.log("PRAGMA foreign_keys=OFF;");

// Drop all tables
for (const t of [...tables].reverse()) {
	console.log(`DROP TABLE IF EXISTS "${t.name}";`);
}

// Create all tables
for (const t of tables) {
	console.log(`${t.sql};`);
}

// Insert data (FK off, so order doesn't matter)
for (const t of tables) {
	dumpTable(t.name);
}

db.close();
