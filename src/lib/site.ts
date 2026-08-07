/**
 * Canonical origin of the deployed site, used for per-route canonical links.
 *
 * Also imported by maintenance/scripts/og-data-gen.ts to build sitemap URLs, so
 * the sitemap and the canonical tags can never disagree. fallow ignores
 * `maintenance/**`, so it cannot see that consumer and reports this as unused.
 */
export const SITE_ORIGIN = "https://linkedfin.net";

/** Absolute canonical URL for a path such as `/name/nm_0118`. */
export function canonical(path: string): string {
	return `${SITE_ORIGIN}${path}`;
}
