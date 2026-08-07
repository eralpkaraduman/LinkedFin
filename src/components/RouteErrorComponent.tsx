import type { ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "#/components/ui/button";

/** Same-origin scripts the current document references. */
function appScriptUrls(): string[] {
	const nodes = document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
		'script[src], link[rel="modulepreload"][href]',
	);
	return Array.from(nodes, (node) =>
		node instanceof HTMLLinkElement ? node.href : node.src,
	).filter((url) => url.startsWith(`${window.location.origin}/`));
}

export function RouteErrorComponent({ error }: ErrorComponentProps) {
	// A plain reload revalidates the document but lets cached subresources stand,
	// so a stale or 404'd chunk survives it. `{cache: "reload"}` overwrites those
	// cache entries, and the reload only helps once they have settled.
	async function retry() {
		await Promise.allSettled(
			appScriptUrls().map((url) => fetch(url, { cache: "reload" })),
		);
		window.location.reload();
	}

	return (
		<div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
			<h1 className="text-lg font-medium">This page failed to load</h1>
			<p className="max-w-prose text-sm text-muted-foreground">
				If a new version was deployed while this tab was open, your browser may
				be holding on to a file that no longer exists. Reloading with fresh
				copies of the app's files usually fixes it. If it doesn't, the problem
				is on our side.
			</p>
			<Button type="button" onClick={retry}>
				Reload with fresh files
			</Button>
			{error?.message ? (
				<pre className="max-w-full overflow-x-auto text-xs text-muted-foreground">
					{error.message}
				</pre>
			) : null}
		</div>
	);
}
