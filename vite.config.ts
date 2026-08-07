import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const GENERATED_DIR = resolve(import.meta.dirname, ".generated");

/**
 * Both inputs are written by `pnpm og:generate`, which runs first in
 * `pnpm build`. They are read as JSON rather than queried here so the
 * better-sqlite3 native module never has to load in the Vite config, which
 * would drag it into `vite dev` and `vitest` too.
 *
 * Missing files are not fatal: a bare `vite dev` on a fresh clone still boots,
 * it just has nothing to prerender and no baked dataset (the browser reads
 * /fish.db as always).
 */
function readGenerated<T>(file: string, fallback: T): T {
	try {
		return JSON.parse(readFileSync(resolve(GENERATED_DIR, file), "utf8")) as T;
	} catch {
		console.warn(
			`[vite] .generated/${file} missing — run \`pnpm og:generate\`. Continuing without it.`,
		);
		return fallback;
	}
}

const generatedPaths = readGenerated<string[]>("prerender-pages.json", []);

/**
 * The content-addressed database filename, baked into both bundles.
 *
 * `og:generate` writes `public/fish-<hash>.db` and records the name here; the
 * browser must fetch that URL rather than `/fish.db` for the immutable
 * `_headers` rule to buy anything.
 *
 * This is a `define` and not a companion to `virtual:fish-data`, deliberately.
 * The virtual module exists because its payload is 270 KB and must *differ*
 * between the server and client builds; a module is the only way to vary it.
 * This is one string that must be *identical* everywhere, and `define` inlines
 * it at the use site — no extra chunk on the critical path, which matters when
 * the whole point is saving a round trip. It also degrades correctly under
 * vitest: `vitest.config.ts` does not load this file's plugins, so a virtual
 * module imported by `src/lib/database.ts` would be unresolvable there (tests
 * reach it transitively through `DatabaseContext`), whereas an unreplaced
 * `typeof __FISH_DB_FILE__` is simply `"undefined"` and the fallback applies.
 *
 * The fallback is `fish.db`, which is still deployed and still correct — just
 * revalidated rather than immutable. A fresh clone running `vite dev` without
 * `og:generate` therefore still has a working search.
 */
const fishDbFile = readGenerated<{ file: string }>("fish-db.json", {
	file: "fish.db",
}).file;

/**
 * The homepage cannot be listed as plain `/`.
 *
 * `post-build.ts` appends the SPA shell to the page list under `spa.maskPath`,
 * which defaults to `/`, and `prerender.ts` then de-duplicates the list by
 * path. The shell entry wins, `/` renders shell-only, and `dist/client` ends up
 * with no index.html at all — the failure is silent, since every other page is
 * produced normally.
 *
 * A query string makes the entry a distinct key while `outputPath` still writes
 * it to index.html. The parameter itself is inert: the route's `validateSearch`
 * drops unknown keys, and the browser's own URL is what the router hydrates
 * from. `/_shell` is not usable as a mask path instead — no route matches it,
 * so the shell request 404s and fails the build.
 */
const prerenderPages = generatedPaths.map((path) =>
	path === "/"
		? {
				path: "/?prerender=home",
				prerender: { enabled: true, outputPath: "/" },
			}
		: { path, prerender: { enabled: true } },
);

/**
 * Serves the baked dataset to the *server* build only.
 *
 * Prerendering renders each page in Node, where sqlite-wasm cannot run, so the
 * data has to be inlined into the server bundle. The client build gets an empty
 * dataset instead, keeping ~270 KB of JSON out of the browser bundle — there
 * the app still downloads /fish.db and queries it with sqlite-wasm.
 */
function fishDataPlugin(): Plugin {
	const id = "virtual:fish-data";
	const resolvedId = `\0${id}`;
	return {
		name: "linkedfin:fish-data",
		resolveId(source) {
			return source === id ? resolvedId : undefined;
		},
		load(loadId, options) {
			if (loadId !== resolvedId) return undefined;
			if (!options?.ssr) {
				return "export default { names: [], relations: [] };";
			}
			const data = readGenerated<unknown>("fish-data.json", {
				names: [],
				relations: [],
			});
			return `export default ${JSON.stringify(data)};`;
		},
	};
}

const config = defineConfig({
	base: "/",
	define: {
		__FISH_DB_FILE__: JSON.stringify(fishDbFile),
	},
	server: {
		port: 4141,
		strictPort: true,
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
	},
	optimizeDeps: {
		exclude: ["@sqlite.org/sqlite-wasm"],
	},
	plugins: [
		devtools(),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		fishDataPlugin(),
		tanstackStart({
			spa: {
				enabled: true,
				/**
				 * The shell is written as `404.html` instead of `_shell.html`.
				 *
				 * Every real URL is now a prerendered file, so the only requests left
				 * over are dead ones — an old link, a deleted id, a typo. Cloudflare
				 * Pages answers those from `404.html` when it exists, and otherwise
				 * falls back to `index.html`. Falling back to index.html is what we
				 * must avoid: index.html is a real page carrying dehydrated router
				 * state for `/`, and serving it at some other URL asks the client to
				 * hydrate state that does not describe the page. The shell hydrates
				 * at whatever URL it is served from and renders the app's own "not
				 * found" screen — now with a real 404 status instead of the soft 404
				 * the SPA fallback used to produce.
				 *
				 * `_redirects` with a `/* /_shell.html 200` rule is not an
				 * alternative: Pages evaluates it ahead of static assets, so it
				 * swallows the prerendered pages (and /fish.db) as well.
				 */
				prerender: { outputPath: "/404" },
			},
			/**
			 * Every indexable URL, enumerated from public/fish.db at build time.
			 * `crawlLinks` cannot discover them — the pages link to each other, but
			 * the crawl would depend on which page happens to be rendered first and
			 * would miss any name that nothing links to.
			 */
			pages: prerenderPages,
			prerender: {
				enabled: true,
				crawlLinks: false,
				/**
				 * Write `name/nm_0118.html`, not `name/nm_0118/index.html`.
				 * Cloudflare Pages serves a directory index only at its trailing-slash
				 * URL and 308s `/name/nm_0118` to `/name/nm_0118/` — a redirect on
				 * every single indexable URL, none of which match the sitemap or the
				 * canonical tags. Flat .html files are served at the exact path.
				 */
				autoSubfolderIndex: false,
				// A page that fails to render must fail the build rather than ship
				// as a silently missing file that Pages answers with the SPA shell.
				failOnError: true,
			},
		}),
		viteReact(),
	],
});

export default config;
