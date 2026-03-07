import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import Header from "../components/Header";
import { DatabaseProvider } from "../lib/DatabaseContext";

import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){var d=document.documentElement,mq=window.matchMedia('(prefers-color-scheme:dark)');function apply(dark){d.classList.remove('light','dark');d.classList.add(dark?'dark':'light');d.style.colorScheme=dark?'dark':'light';}apply(mq.matches);mq.addEventListener('change',function(e){apply(e.matches);});})();`;

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
			{
				title: "LinkedFin - Fish Names Etymology Database",
			},
			{
				name: "description",
				content:
					"Explore the origins and meanings of fish names across languages. A comprehensive etymology database linking Mediterranean fish names from Turkish, Greek, Arabic, and more.",
			},
			// Open Graph
			{
				property: "og:type",
				content: "website",
			},
			{
				property: "og:site_name",
				content: "LinkedFin",
			},
			{
				property: "og:title",
				content: "LinkedFin - Fish Names Etymology Database",
			},
			{
				property: "og:description",
				content:
					"Explore the origins and meanings of fish names across languages. A comprehensive etymology database linking Mediterranean fish names.",
			},
			{
				property: "og:url",
				content: "https://eralpkaraduman.github.io/LinkedFin/",
			},
			{
				property: "og:image",
				content: "https://eralpkaraduman.github.io/LinkedFin/og-image.png",
			},
			{
				property: "og:image:width",
				content: "1200",
			},
			{
				property: "og:image:height",
				content: "630",
			},
			{
				property: "og:locale",
				content: "en_US",
			},
			// Twitter Card
			{
				name: "twitter:card",
				content: "summary_large_image",
			},
			{
				name: "twitter:title",
				content: "LinkedFin - Fish Names Etymology Database",
			},
			{
				name: "twitter:description",
				content:
					"Explore the origins and meanings of fish names across languages. A comprehensive etymology database linking Mediterranean fish names.",
			},
			{
				name: "twitter:image",
				content: "https://eralpkaraduman.github.io/LinkedFin/og-image.png",
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
			{
				name: "theme-color",
				content: "#ffffff",
				media: "(prefers-color-scheme: light)",
			},
			{
				name: "theme-color",
				content: "#252525",
				media: "(prefers-color-scheme: dark)",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "canonical",
				href: "https://eralpkaraduman.github.io/LinkedFin/",
			},
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
			<body className="font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]">
				<DatabaseProvider>
					<Header />
					{children}
				</DatabaseProvider>
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
