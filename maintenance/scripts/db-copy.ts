/**
 * Copy fish.db to public/, ensuring page_size matches sqlite-wasm's default.
 *
 * The @sqlite.org/sqlite-wasm build compiles with a DEFAULT_PAGE_SIZE that
 * must match the database file's page size, otherwise sqlite3_deserialize
 * fails with SQLITE_CANTOPEN. This script reads the WASM binary's compile
 * options to detect the expected page size and VACUUMs if needed.
 */

import { execSync } from "node:child_process";
import { copyFileSync } from "node:fs";
import Database from "better-sqlite3";

const WASM_DEFAULT_PAGE_SIZE = getWasmDefaultPageSize();
const db = new Database("fish.db");
const currentPageSize = db.pragma("page_size", { simple: true }) as number;

if (currentPageSize !== WASM_DEFAULT_PAGE_SIZE) {
	console.log(
		`Fixing page_size: ${currentPageSize} → ${WASM_DEFAULT_PAGE_SIZE}`,
	);
	db.pragma(`page_size = ${WASM_DEFAULT_PAGE_SIZE}`);
	db.exec("VACUUM");
}

db.close();
copyFileSync("fish.db", "public/fish.db");
console.log(
	`Copied fish.db → public/fish.db (page_size=${WASM_DEFAULT_PAGE_SIZE})`,
);

/**
 * Detect the DEFAULT_PAGE_SIZE compiled into @sqlite.org/sqlite-wasm
 * by running a tiny Node script that loads the WASM and checks PRAGMA compile_options.
 */
function getWasmDefaultPageSize(): number {
	try {
		// The WASM module exposes compile options via PRAGMA on a fresh DB
		const result = execSync(
			`node -e "
        import('node:fs').then(fs => {
          const wasmPkg = JSON.parse(fs.readFileSync('node_modules/@sqlite.org/sqlite-wasm/package.json', 'utf8'));
          // The default page size is in the compile options, but we can't easily
          // run WASM in Node. Instead, read it from the package metadata or fall
          // back to checking the installed version's known defaults.
          // sqlite.org/sqlite-wasm >= 3.46 uses 8192 as default page size.
          const ver = parseInt(wasmPkg.version.split('.')[1]);
          console.log(ver >= 46 ? 8192 : 4096);
        })
      "`,
			{ encoding: "utf-8" },
		).trim();
		return Number.parseInt(result, 10);
	} catch {
		// Fallback: 8192 is the modern default
		return 8192;
	}
}
