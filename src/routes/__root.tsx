import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClientProvider } from "@tanstack/react-query";
import {
	createRootRoute,
	HeadContent,
	Link,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import Header from "../components/Header";
import { DatabaseProvider } from "../lib/DatabaseContext";
import { queryClient } from "../lib/queryClient";
import { GENERIC_META } from "../shared/pageMeta";

import appCss from "../styles.css?url";

/**
 * Runs before first paint so the page never flashes the wrong scheme.
 *
 * It also owns `theme-color`, because that tag cannot be expressed as a
 * light/dark pair: TanStack dedupes head meta on `name`, so only one of two
 * `theme-color` entries survives regardless of their `media` attributes. Setting
 * it here keeps the browser chrome correct in both schemes and on live changes.
 */
const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement,mq=window.matchMedia('(prefers-color-scheme:dark)');function apply(dark){d.classList.remove('light','dark');d.classList.add(dark?'dark':'light');d.style.colorScheme=dark?'dark':'light';var t=document.querySelector('meta[name="theme-color"]');if(t)t.setAttribute('content',dark?'#252525':'#ffffff');}apply(mq.matches);mq.addEventListener('change',function(e){apply(e.matches);});})();`;

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover",
			},
			/**
			 * The fallback title and description, for any match that does not set
			 * its own. Read from `GENERIC_META` rather than written out again —
			 * the same two strings are the OG card's generic text and the
			 * `<meta>` of the SPA shell, and they used to be typed in three
			 * places.
			 *
			 * Every real page overrides both from its own `head()`; TanStack
			 * Router de-duplicates meta by `name ?? property`, deepest match
			 * first. The OG, Twitter, robots and JSON-LD tags are set there too
			 * (see `src/lib/head.ts`) and deliberately have no root-level
			 * fallback: a generic `og:url` on every page is worse than none.
			 */
			{
				title: GENERIC_META.title,
			},
			{
				name: "description",
				content: GENERIC_META.description,
			},
			// PWA / Mobile
			{
				name: "apple-mobile-web-app-capable",
				content: "yes",
			},
			{
				name: "mobile-web-app-capable",
				content: "yes",
			},
			{
				name: "apple-mobile-web-app-status-bar-style",
				content: "black-translucent",
			},
			/**
			 * One tag, kept current by THEME_INIT_SCRIPT.
			 *
			 * There used to be two — a light and a dark variant distinguished only
			 * by `media` — and only one ever reached the page. TanStack dedupes
			 * head meta on `m.name ?? m.property`
			 * (@tanstack/react-router headContentUtils.js:31), and `media` is not
			 * part of that key, so the second silently replaced the first. Nothing
			 * errors; the code just reads as though it works.
			 *
			 * The static value is the light one, so a reader with JavaScript off
			 * gets the right colour in the common case. The script corrects it
			 * before paint and on every scheme change.
			 */
			{
				name: "theme-color",
				content: "#ffffff",
			},
		],
		scripts: [
			{
				src: "https://umami.cicex.cloud/script.js",
				defer: true,
				"data-website-id": "4d1a7783-1d30-4f9d-a057-aec92bade968",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			// No canonical here. A root-level tag would declare every /name/*
			// and /species/* page a duplicate of the homepage. Each route emits
			// its own from head(), which reaches the prerendered HTML a crawler
			// fetches.
			{
				rel: "icon",
				type: "image/x-icon",
				href: "/favicon.ico",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon.png",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: Theme script prevents FOUC */}
				<script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
				<HeadContent />
			</head>
			<body
				className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]"
				suppressHydrationWarning
			>
				<QueryClientProvider client={queryClient}>
					<DatabaseProvider>
						<Header />
						{children}
						{/*
							/about is prerendered and indexable, so it was reachable by
							crawlers but by nobody else — there was no link to it anywhere
							in the app. This is that link.
						*/}
						<footer className="px-4 py-8 text-center text-sm text-muted-foreground">
							<Link to="/about" className="underline">
								About this database
							</Link>
						</footer>
					</DatabaseProvider>
				</QueryClientProvider>
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
