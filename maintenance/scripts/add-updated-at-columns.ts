/**
 * Add `updated_at` to `names` and `species`.
 *
 * The database has carried no timestamp of any kind, so there has been no way
 * to tell when a record last changed — git only dates commits, and
 * public/fish.db is a binary blob, so a commit touching one etymology looks
 * identical to one touching four hundred.
 *
 * Deliberately only these two tables:
 * - `regions` is `(id, name)` and never changes, but /region/$id renders that
 *   region's *names*. A regions.updated_at would claim "unchanged" while the
 *   page's content moved. Region freshness is derived: MAX over its names.
 * - `name_relations` renders on *name* pages, so adding a relation changes
 *   /name/$id without touching either names row. Rather than a column here,
 *   relation edits stamp updated_at on both endpoint names.
 *
 * Nullable, with no DEFAULT. A DEFAULT CURRENT_TIMESTAMP would stamp every
 * existing row at migration time — destroying the distinction the backfill is
 * about to draw between records datable from a migration script and records
 * that simply are not — and would write SQLite's "YYYY-MM-DD HH:MM:SS" rather
 * than ISO 8601.
 *
 * Idempotent: re-running is a no-op.
 *
 * Run: pnpm tsx maintenance/scripts/add-updated-at-columns.ts
 */

import Database from "better-sqlite3";
import { resolve } from "node:path";

const DB_PATH = resolve(import.meta.dirname, "../../public/fish.db");

const db = new Database(DB_PATH);

function hasColumn(table: string, column: string): boolean {
	const cols = db.pragma(`table_info(${table})`) as { name: string }[];
	return cols.some((c) => c.name === column);
}

let added = 0;
for (const table of ["names", "species"]) {
	if (hasColumn(table, "updated_at")) {
		console.log(`- ${table}.updated_at already exists, skipping`);
		continue;
	}
	db.exec(`ALTER TABLE ${table} ADD COLUMN updated_at TEXT`);
	console.log(`+ added ${table}.updated_at`);
	added++;
}

const counts = {
	names: (db.prepare("SELECT COUNT(*) AS c FROM names").get() as { c: number })
		.c,
	species: (
		db.prepare("SELECT COUNT(*) AS c FROM species").get() as { c: number }
	).c,
};
const nulls = {
	names: (
		db
			.prepare("SELECT COUNT(*) AS c FROM names WHERE updated_at IS NULL")
			.get() as { c: number }
	).c,
	species: (
		db
			.prepare("SELECT COUNT(*) AS c FROM species WHERE updated_at IS NULL")
			.get() as { c: number }
	).c,
};

const pageSize = db.pragma("page_size", { simple: true }) as number;
const integrity = db.pragma("integrity_check", { simple: true }) as string;
db.close();

console.log(
	`\n${counts.names} names (${nulls.names} awaiting backfill), ` +
		`${counts.species} species (${nulls.species} awaiting backfill)`,
);
console.log(`page_size ${pageSize}, integrity ${integrity}`);

if (integrity !== "ok") {
	console.error(`integrity_check returned "${integrity}"`);
	process.exit(1);
}
if (added > 0) {
	console.log("\nNext: pnpm db:types, then the backfill (TREK-559).");
	console.log("Commit public/fish.db — the file was rewritten.");
}
