/**
 * The one place route loaders get data from, in either environment.
 *
 * There is no runtime server: `wrangler.toml` deploys `dist/client` only. So a
 * loader has to resolve twice over, from two completely different sources:
 *
 * - **In Node, at build time.** Prerendering is a real HTTP render against the
 *   built server bundle, inside the Vite build process. sqlite-wasm cannot run
 *   there (no `fetch` of `/fish.db`, no browser), so the data is inlined into
 *   the server bundle as `virtual:fish-data` — see the plugin in
 *   vite.config.ts, fed by `.generated/fish-data.json` from `pnpm og:generate`.
 * - **In the browser, on client-side navigation.** The existing sqlite-wasm
 *   path: download `/fish.db`, query it with Kysely.
 *
 * The `import.meta.env.SSR` branch is compiled away in each build, so the
 * client bundle never contains the baked dataset and the server bundle never
 * reaches for sqlite-wasm.
 */

import { getNames, getRelations, initDatabase } from "./database";
import type { FishName, Relation } from "./types";

export interface FishData {
	names: FishName[];
	relations: Relation[];
}

/**
 * Cached for the process/tab lifetime. In Node this matters a lot: 620 pages
 * are prerendered in one process and would otherwise re-parse the dataset each
 * time. In the browser it keeps repeat navigations off the sqlite-wasm path.
 */
let cached: FishData | null = null;
let pending: Promise<FishData> | null = null;

async function load(): Promise<FishData> {
	if (import.meta.env.SSR) {
		const module = await import("virtual:fish-data");
		return module.default;
	}
	await initDatabase();
	return { names: getNames(), relations: getRelations() };
}

export async function loadFishData(): Promise<FishData> {
	if (cached) return cached;
	if (!pending) {
		pending = load().then((data) => {
			cached = data;
			pending = null;
			return data;
		});
	}
	return pending;
}
