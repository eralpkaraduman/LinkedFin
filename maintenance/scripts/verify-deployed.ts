/**
 * Check a DEPLOYED site, not a build.
 *
 * `verify-build.ts` and `db:validate` both inspect `dist/` and `public/fish.db`.
 * That is correct, and it is also why neither can see the one failure mode we
 * have actually hit: a record is deleted, the build is right, the sitemap is
 * right — and the old page keeps being served anyway from a cache below the
 * layer we can purge. nm_0438 did this and survived three purges including
 * Purge Everything.
 *
 * So this asserts two things against a real origin:
 *   1. every path in maintenance/tombstones.json returns 404
 *   2. a sample of live sitemap URLs still returns 200 — so a broken deploy
 *      cannot pass merely by 404ing everything
 *
 * Deliberately NOT part of `pnpm pipeline`. The pipeline runs *inside* the
 * Cloudflare build, before the deployment exists; there is nothing deployed to
 * check yet. Run it after a deploy, against production or a deployment alias:
 *
 *   pnpm verify:deployed
 *   pnpm verify:deployed https://<hash>.linkedfin.pages.dev
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const BASE = (process.argv[2] ?? "https://linkedfin.net").replace(/\/$/, "");
const SAMPLE_SIZE = 8;

interface Tombstones {
	paths: string[];
}

const tombstones = JSON.parse(
	readFileSync(resolve(import.meta.dirname, "../tombstones.json"), "utf8"),
) as Tombstones;

const failures: string[] = [];
const notes: string[] = [];

async function status(path: string): Promise<number> {
	const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
	return res.status;
}

console.log(`Checking deployed site: ${BASE}\n`);

// 1. Deleted pages must be gone.
for (const path of tombstones.paths) {
	const code = await status(path);
	if (code === 404 || code === 410) {
		console.log(`  ✅ ${path} → ${code}`);
	} else {
		failures.push(
			`${path} returned ${code}, expected 404 — a deleted page is still being served`,
		);
		console.log(`  ❌ ${path} → ${code}`);
	}
}

// 2. …but the site must still be alive, or a wholly broken deploy would pass.
const sitemap = await fetch(`${BASE}/sitemap.xml`).then((r) => r.text());
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

if (urls.length === 0) {
	failures.push("sitemap.xml listed no URLs — cannot sample live pages");
} else {
	// Evenly spaced rather than random, so a failure is reproducible.
	const step = Math.max(1, Math.floor(urls.length / SAMPLE_SIZE));
	const sample = urls.filter((_, i) => i % step === 0).slice(0, SAMPLE_SIZE);
	console.log(`\n  sampling ${sample.length} of ${urls.length} sitemap URLs`);
	for (const url of sample) {
		const path = new URL(url).pathname;
		const code = await status(path);
		if (code !== 200) {
			failures.push(`${path} returned ${code}, expected 200`);
			console.log(`  ❌ ${path} → ${code}`);
		}
	}
	notes.push(`${urls.length} sitemap URLs, ${sample.length} sampled`);
}

console.log("");
if (failures.length > 0) {
	console.error("❌ Deployed site verification FAILED\n");
	for (const f of failures) console.error(`   ${f}`);
	console.error(
		"\n   A tombstone still returning 200 means the deletion did not reach the edge.",
	);
	console.error(
		"   The build being correct does not settle this — check the deployed site.",
	);
	process.exit(1);
}

console.log(
	`✅ Deployed site verified: ${tombstones.paths.length} tombstone(s) gone, ${notes.join(", ")}`,
);
