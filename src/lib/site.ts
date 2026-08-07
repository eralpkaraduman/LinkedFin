/** Canonical origin of the deployed site, used for per-route canonical links. */
export const SITE_ORIGIN = "https://linkedfin.net";

/** Absolute canonical URL for a path such as `/name/nm_0118`. */
export function canonical(path: string): string {
	return `${SITE_ORIGIN}${path}`;
}
