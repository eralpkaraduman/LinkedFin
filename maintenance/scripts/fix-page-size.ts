/**
 * Reset public/fish.db's page_size to what sqlite-wasm expects.
 *
 * `pnpm db:validate` fails the build when the page size drifts, because
 * sqlite-wasm cannot open a database whose pages are the wrong size — and
 * db:validate runs inside `pnpm pipeline`, which is the Cloudflare build
 * command. So a drift here blocks deployment.
 *
 * The message used to say "Run pnpm db:copy to fix", a script that was removed
 * when public/fish.db became the single source of truth (commit 364f355). This
 * exists so the advice points at something real.
 *
 * A page size can only be changed on a non-empty database by setting the pragma
 * and then VACUUMing — the pragma alone is silently ignored.
 *
 * Run: pnpm db:fix-page-size
 */

import Database from "better-sqlite3";
import { resolve } from "node:path";
import { expectedWasmPageSize } from "./wasm-page-size.ts";

const DB_PATH = resolve(import.meta.dirname, "../../public/fish.db");

const expected = expectedWasmPageSize();
const db = new Database(DB_PATH);
const before = db.pragma("page_size", { simple: true }) as number;

if (before === expected) {
	console.log(`✅ page_size is already ${expected} — nothing to do`);
	db.close();
	process.exit(0);
}

console.log(`page_size is ${before}, rewriting to ${expected}…`);
db.pragma(`page_size = ${expected}`);
db.exec("VACUUM");

const after = db.pragma("page_size", { simple: true }) as number;
const integrity = db.pragma("integrity_check", { simple: true }) as string;
const names = db.prepare("SELECT COUNT(*) AS c FROM names").get() as {
	c: number;
};
db.close();

if (after !== expected) {
	console.error(`❌ page_size is still ${after} — expected ${expected}`);
	process.exit(1);
}
if (integrity !== "ok") {
	console.error(`❌ integrity_check returned "${integrity}" after VACUUM`);
	process.exit(1);
}

console.log(
	`✅ page_size ${before} → ${after}, integrity ok, ${names.c} names intact`,
);
console.log("   Commit public/fish.db — the file was rewritten.");
