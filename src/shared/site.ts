/**
 * Identity of the deployed site.
 *
 * Lives in `src/shared/` rather than `src/lib/` because Cloudflare Pages
 * Functions import it too — see the module note in `src/shared/pageMeta.ts` for
 * what that costs and what it buys. It used to be declared twice, here and in
 * `functions/jsonld.ts`, which meant a structured-data `@id` and a canonical
 * link could disagree about what this site is called.
 */
export const SITE_ORIGIN = "https://linkedfin.net";

/** Absolute canonical URL for a path such as `/name/nm_0118`. */
export function canonical(path: string): string {
	return `${SITE_ORIGIN}${path}`;
}
