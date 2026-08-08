/**
 * Backfill `names.updated_at` and `species.updated_at` (TREK-559).
 *
 * add-updated-at-columns.ts added both columns nullable and empty. There is no
 * per-record history to recover them from: public/fish.db is a binary blob, so
 * a commit that changed one etymology is indistinguishable from one that
 * changed four hundred. The only per-record evidence in the repository is the
 * pile of one-off `add-*` / `fix-*` migration scripts in this directory. Each
 * one names the records it touched, and each is datable from the commit that
 * introduced it.
 *
 * So: attribute records to scripts, date the scripts from git, and take the
 * LATEST date per record — the column means "last touched", not "created".
 *
 * ## What counts as evidence
 *
 * An id appearing in a script is not proof the script wrote it. Ids also turn
 * up in comments, in console.log lines, in verification SELECTs, and — for
 * species — as foreign keys inside *name* payloads. Three filters:
 *
 * 1. Comments (block and line) are stripped before any id is extracted.
 * 2. `nm_` ids count only in scripts that actually write `names` or
 *    `name_relations`. Relations are included deliberately: a relation renders
 *    on the name page, so adding one changes /name/$id, and the agreed design
 *    (see add-updated-at-columns.ts) is that relation edits stamp both
 *    endpoint names.
 * 3. `sp_` ids count only inside a species *write site* — a line declaring a
 *    `scientific_name` (the species-row literal form), or the few lines of an
 *    `INSERT INTO species` / `UPDATE species` / `DELETE FROM species`
 *    statement, resolving `const x = "sp_XXX"` variables used there.
 *    Without this last filter the count nearly inflates by half: most `sp_`
 *    mentions are `species_id` foreign keys in names payloads, which say
 *    nothing about when the species row itself changed.
 *
 * Ids that no longer exist in the database (renamed, deleted, never inserted)
 * are discarded — roughly two dozen `nm_` ids are stale in this way.
 *
 * ## Caveats, on the record
 *
 * - A script's commit date is when it was *added to git*, not necessarily when
 *   it ran against the database. These are approximations of edit time, close
 *   enough to sort and display, not audit-grade timestamps.
 * - Records with no script evidence get the current time. That is a deliberate
 *   decision (user, 2026-08-08): the alternative is either leaving NULLs, which
 *   the UI would have to special-case forever, or inventing dates. "We know
 *   this row was correct as of the backfill" is at least true.
 * - Scripts written before the repository's history began, or edits made by
 *   hand rather than by a script, are invisible here. The fallback bucket is
 *   therefore "no evidence", not "never edited".
 *
 * Idempotent: dated records are recomputed from the same evidence every run;
 * the current-time fallback is only written where updated_at IS NULL, so
 * re-running does not churn timestamps.
 *
 * Run: pnpm tsx maintenance/scripts/backfill-updated-at.ts
 *      pnpm db:validate
 */

import Database from "better-sqlite3";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCRIPTS_DIR = import.meta.dirname;
const REPO_ROOT = resolve(SCRIPTS_DIR, "../..");
const DB_PATH = resolve(REPO_ROOT, "public/fish.db");

/** Lines after an `INSERT INTO species`-style statement still inside it. */
const SQL_WINDOW = 8;

function stripComments(src: string): string {
	return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function writesTable(code: string, table: string): boolean {
	const re = new RegExp(
		`(INSERT\\s+(OR\\s+\\w+\\s+)?INTO|UPDATE|DELETE\\s+FROM)\\s+["'\`]?${table}\\b`,
		"i",
	);
	return re.test(code);
}

/** Ids of species rows this script writes, not species it merely points at. */
function speciesWriteIds(code: string): Set<string> {
	const ids = new Set<string>();
	const lines = code.split("\n");

	// `const speciesId = "sp_102"` used inside a statement a few lines below.
	const varToId = new Map<string, string>();
	for (const m of code.matchAll(
		/\b(?:const|let|var)\s+(\w+)\s*=\s*["'`](sp_\d{3})["'`]/g,
	)) {
		varToId.set(m[1], m[2]);
	}

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const isRowLiteral = /scientific_name/.test(line);
		const isSpeciesWrite =
			/(INSERT\s+(OR\s+\w+\s+)?INTO|UPDATE|DELETE\s+FROM)\s+["'`]?species\b/i.test(
				line,
			);
		if (!isRowLiteral && !isSpeciesWrite) continue;

		const window = isSpeciesWrite
			? lines.slice(i, i + SQL_WINDOW + 1).join("\n")
			: line;
		for (const m of window.match(/sp_\d{3}/g) ?? []) ids.add(m);
		for (const [name, id] of varToId) {
			if (new RegExp(`\\b${name}\\b`).test(window)) ids.add(id);
		}
	}
	return ids;
}

/** ISO 8601 UTC, second precision, of the commit that added `file`. */
function addedAt(file: string): string | null {
	const out = execFileSync(
		"git",
		["log", "--diff-filter=A", "--format=%aI", "--", `maintenance/scripts/${file}`],
		{ cwd: REPO_ROOT, encoding: "utf8" },
	).trim();
	if (!out) return null; // not committed yet
	const lines = out.split("\n");
	// A file can be added more than once (deleted, restored). Oldest wins as
	// "introduced", but any later re-add is a real edit too, so take the latest.
	const newest = lines[0];
	return new Date(newest).toISOString().replace(/\.\d{3}Z$/, "Z");
}

const db = new Database(DB_PATH);
const realNames = new Set(
	(db.prepare("SELECT id FROM names").all() as { id: string }[]).map((r) => r.id),
);
const realSpecies = new Set(
	(db.prepare("SELECT id FROM species").all() as { id: string }[]).map((r) => r.id),
);

const files = readdirSync(SCRIPTS_DIR)
	.filter((f) => /^(add|fix)-.*\.ts$/.test(f))
	.sort();

/** id -> latest evidence date */
const nameDates = new Map<string, string>();
const speciesDates = new Map<string, string>();
let undated = 0;
let mentionedNames = 0;
let mentionedSpecies = 0;
let staleNames = 0;
let staleSpecies = 0;
const seenNames = new Set<string>();
const seenSpecies = new Set<string>();

function record(map: Map<string, string>, id: string, date: string) {
	const prev = map.get(id);
	if (!prev || date > prev) map.set(id, date);
}

for (const file of files) {
	const code = stripComments(readFileSync(resolve(SCRIPTS_DIR, file), "utf8"));
	const touchesNames =
		writesTable(code, "names") || writesTable(code, "name_relations");
	const spIds = writesTable(code, "species")
		? speciesWriteIds(code)
		: new Set<string>();
	const nmIds = touchesNames
		? new Set(code.match(/nm_\d{4}/g) ?? [])
		: new Set<string>();
	if (nmIds.size === 0 && spIds.size === 0) continue;

	const date = addedAt(file);
	if (!date) {
		undated++;
		console.log(`- ${file}: not in git history yet, skipped as evidence`);
		continue;
	}
	for (const id of nmIds) {
		seenNames.add(id);
		if (realNames.has(id)) record(nameDates, id, date);
	}
	for (const id of spIds) {
		seenSpecies.add(id);
		if (realSpecies.has(id)) record(speciesDates, id, date);
	}
}

mentionedNames = seenNames.size;
mentionedSpecies = seenSpecies.size;
staleNames = [...seenNames].filter((id) => !realNames.has(id)).length;
staleSpecies = [...seenSpecies].filter((id) => !realSpecies.has(id)).length;

const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");

const setName = db.prepare("UPDATE names SET updated_at = ? WHERE id = ?");
const setSpecies = db.prepare("UPDATE species SET updated_at = ? WHERE id = ?");
const fillNames = db.prepare(
	"UPDATE names SET updated_at = ? WHERE updated_at IS NULL",
);
const fillSpecies = db.prepare(
	"UPDATE species SET updated_at = ? WHERE updated_at IS NULL",
);

const apply = db.transaction(() => {
	for (const [id, date] of nameDates) setName.run(date, id);
	for (const [id, date] of speciesDates) setSpecies.run(date, id);
	const n = fillNames.run(now).changes;
	const s = fillSpecies.run(now).changes;
	return { n, s };
});
const filled = apply();

const totals = db
	.prepare(
		"SELECT (SELECT COUNT(*) FROM names) AS names, (SELECT COUNT(*) FROM species) AS species",
	)
	.get() as { names: number; species: number };
const remaining = db
	.prepare(
		"SELECT (SELECT COUNT(*) FROM names WHERE updated_at IS NULL) AS names," +
			" (SELECT COUNT(*) FROM species WHERE updated_at IS NULL) AS species",
	)
	.get() as { names: number; species: number };

const allDates = [...nameDates.values(), ...speciesDates.values()].sort();

console.log(`\nEvidence: ${files.length} add-*/fix-* scripts scanned`);
console.log(
	`  names:   ${mentionedNames} ids in write positions, ${staleNames} stale (not in db)`,
);
console.log(
	`  species: ${mentionedSpecies} ids in write positions, ${staleSpecies} stale (not in db)`,
);

console.log("\nAttribution split");
console.log(
	`  names:   ${nameDates.size} dated from a script, ${totals.names - nameDates.size} at current time (${filled.n} written this run)`,
);
console.log(
	`  species: ${speciesDates.size} dated from a script, ${totals.species - speciesDates.size} at current time (${filled.s} written this run)`,
);
if (allDates.length > 0) {
	console.log(
		`  real dates span ${allDates[0]} .. ${allDates[allDates.length - 1]}`,
	);
}
console.log(`  fallback stamp: ${now}`);
if (undated > 0) {
	console.log(`  ${undated} script(s) had no commit yet and were ignored`);
}

const integrity = db.pragma("integrity_check", { simple: true }) as string;
db.close();

console.log(
	`\n${remaining.names} names and ${remaining.species} species still NULL; integrity ${integrity}`,
);
if (remaining.names > 0 || remaining.species > 0 || integrity !== "ok") {
	process.exit(1);
}
console.log("Commit public/fish.db — the file was rewritten.");
