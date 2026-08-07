/**
 * The SQLite page size that the installed sqlite-wasm expects.
 *
 * sqlite-wasm >= 3.46 defaults to 8192; older builds use 4096. A database whose
 * pages are the wrong size cannot be opened in the browser, so `db:validate`
 * treats a mismatch as an error — and since db:validate runs inside
 * `pnpm pipeline` (the Cloudflare build command), that mismatch blocks a deploy.
 *
 * Shared by the validator and `db:fix-page-size` so the check and the fix can
 * never disagree about the target.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function expectedWasmPageSize(): number {
	try {
		const pkgPath = resolve(
			import.meta.dirname,
			"../../node_modules/@sqlite.org/sqlite-wasm/package.json",
		);
		const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
		const minor = Number.parseInt(pkg.version.split(".")[1], 10);
		return minor >= 46 ? 8192 : 4096;
	} catch {
		return 8192;
	}
}
