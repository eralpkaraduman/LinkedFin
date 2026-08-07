// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { RouteErrorComponent } from "../RouteErrorComponent";

const reload = vi.fn();

function renderError(message = "Failed to fetch dynamically imported module") {
	// biome-ignore lint/suspicious/noExplicitAny: only `error` is read.
	const props = { error: new Error(message) } as any;
	return render(<RouteErrorComponent {...props} />);
}

beforeEach(() => {
	document.head.innerHTML = `
		<script src="/assets/index-abc.js"></script>
		<link rel="modulepreload" href="/assets/ShareActions-def.js" />
		<link rel="stylesheet" href="/assets/styles.css" />
		<script src="https://cdn.example.com/third-party.js"></script>
	`;
	vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("")));
	// jsdom's location.reload is not configurable; replace the whole object.
	vi.stubGlobal("location", {
		origin: window.location.origin,
		href: window.location.href,
		reload,
	});
});

afterEach(() => {
	document.head.innerHTML = "";
	vi.unstubAllGlobals();
	vi.clearAllMocks();
});

test("renders the error copy, the reload control and the underlying message", () => {
	renderError("boom from the route");

	expect(screen.getByText(/this page failed to load/i)).toBeInTheDocument();
	expect(
		screen.getByRole("button", { name: /reload with fresh files/i }),
	).toBeInTheDocument();
	expect(screen.getByText("boom from the route")).toBeInTheDocument();
});

test("the button refetches only same-origin app scripts, cache-bypassing", async () => {
	const origin = window.location.origin;
	renderError();
	await userEvent.click(screen.getByRole("button", { name: /reload/i }));

	const urls = vi.mocked(fetch).mock.calls.map(([url]) => url);
	expect(urls).toEqual([
		`${origin}/assets/index-abc.js`,
		`${origin}/assets/ShareActions-def.js`,
	]);
	for (const call of vi.mocked(fetch).mock.calls) {
		expect(call[1]).toEqual({ cache: "reload" });
	}
});

test("the reload waits for the refetches to settle", async () => {
	let release: () => void = () => {};
	const pending = new Promise<Response>((resolve) => {
		release = () => resolve(new Response(""));
	});
	vi.stubGlobal("fetch", vi.fn().mockReturnValue(pending));

	renderError();
	await userEvent.click(screen.getByRole("button", { name: /reload/i }));

	// Reloading before the refetches settle is the bug this component avoids:
	// the browser would just replay the poisoned cache entry again.
	expect(reload).not.toHaveBeenCalled();

	release();
	await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
});

test("a failed refetch still lets the user through to the reload", async () => {
	vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

	renderError();
	await userEvent.click(screen.getByRole("button", { name: /reload/i }));

	await vi.waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
});
