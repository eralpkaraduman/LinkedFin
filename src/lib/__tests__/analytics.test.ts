// @vitest-environment jsdom
import { trackDetailView, trackSearch } from "../analytics";

beforeEach(() => {
	window.umami = undefined;
});

test("trackDetailView calls umami.track with view_detail event", () => {
	const track = vi.fn();
	window.umami = { track };

	trackDetailView("nm_0001", "Salmon");

	expect(track).toHaveBeenCalledWith("view_detail", {
		name_id: "nm_0001",
		name: "Salmon",
	});
});

test("trackSearch calls umami.track when query has 2+ chars", () => {
	const track = vi.fn();
	window.umami = { track };

	trackSearch("salmon", 5);

	expect(track).toHaveBeenCalledWith("search", {
		query: "salmon",
		result_count: 5,
	});
});

test("trackSearch skips short queries", () => {
	const track = vi.fn();
	window.umami = { track };

	trackSearch("a", 0);
	trackSearch("  ", 0);

	expect(track).not.toHaveBeenCalled();
});

test("track functions no-op when umami is unavailable", () => {
	expect(() => trackDetailView("nm_0001", "Salmon")).not.toThrow();
	expect(() => trackSearch("salmon", 1)).not.toThrow();
});
