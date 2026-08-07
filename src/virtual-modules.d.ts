/**
 * `virtual:fish-data` is produced by the inline `fish-data` plugin in
 * vite.config.ts. It resolves to the baked dataset in the server build and to
 * an empty dataset in the client build, so the 270 KB of JSON never ships to
 * the browser (the browser reads `/fish.db` with sqlite-wasm instead).
 */
declare module "virtual:fish-data" {
	import type { FishData } from "#/lib/fishData";

	const data: FishData;
	export default data;
}
