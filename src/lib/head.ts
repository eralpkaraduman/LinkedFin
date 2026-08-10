/**
 * The full head of a page, built once from one `PageMeta`.
 *
 * Every route's `head()` goes through here, so `<title>`, `og:title` and
 * `twitter:title` cannot drift apart the way the meta tags and the OG tags used
 * to — they are literally the same string, read from the same object.
 *
 * All of it lands in the prerendered HTML. It used to be split: `<title>`,
 * description and canonical came from `head()`, while `og:*`, `twitter:*`,
 * `robots` and the JSON-LD were appended per request by
 * `functions/_middleware.ts` with HTMLRewriter. Two sources for the head is how
 * a page ends up with two `og:title`s, so the middleware no longer appends any
 * of these; see the note at the top of that file for the one job it kept.
 *
 * TanStack Router de-duplicates `meta` entries by `name ?? property`, deepest
 * match first, so a route's tags override the root's and nothing here can
 * double up with `__root.tsx`.
 *
 * Lives in `src/lib/` rather than `src/shared/` on purpose: it speaks TanStack
 * Router's tag shape, which is of no use to a Worker. What both sides share is
 * the `PageMeta` it is handed.
 */

import { type JsonLd, serializeJsonLd } from "#/shared/jsonld";
import {
	ogImagePath,
	type PageMeta,
	SITE_NAME,
	SITE_TAGLINE,
} from "#/shared/pageMeta";
import { canonical } from "#/shared/site";

interface HeadInput {
	/** Path of this page, e.g. `/name/nm_0118`. Canonical, `og:url` and card. */
	path: string;
	meta: PageMeta;
	/**
	 * Structured data for the page, or `null`. An unresolvable id gets none: a
	 * page that does not describe an entity must not claim one.
	 */
	jsonLd?: JsonLd | null;
	/**
	 * Whether the page belongs in the index. False only for a detail route whose
	 * id did not resolve — reachable on client-side navigation, since every real
	 * id is prerendered. `noindex, follow` rather than `noindex, nofollow`: the
	 * links out of the page are still worth crawling.
	 */
	indexable?: boolean;
}

export function buildHead({
	path,
	meta,
	jsonLd = null,
	indexable = true,
}: HeadInput) {
	const url = canonical(path);
	const image = canonical(ogImagePath(path));
	const { title, description } = meta;

	return {
		meta: [
			{ title },
			{ name: "description", content: description },
			{
				name: "robots",
				content: indexable ? "index, follow" : "noindex, follow",
			},
			{ property: "og:type", content: "website" },
			{ property: "og:site_name", content: SITE_NAME },
			{ property: "og:url", content: url },
			{ property: "og:title", content: title },
			{ property: "og:description", content: description },
			{ property: "og:image", content: image },
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "630" },
			{ property: "og:image:type", content: "image/png" },
			{
				property: "og:image:alt",
				content: `${meta.headline} — ${SITE_TAGLINE}`,
			},
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: image },
		],
		links: [{ rel: "canonical", href: url }],
		/**
		 * An inline `<script>` rather than TanStack's `{ "script:ld+json": … }`
		 * meta entry, which HTML-escapes the payload and would leave `&quot;`
		 * where the JSON needs `"`. `serializeJsonLd` does the escaping that a
		 * script body actually requires. See the note on that function.
		 */
		scripts: jsonLd
			? [{ type: "application/ld+json", children: serializeJsonLd(jsonLd) }]
			: [],
	};
}
