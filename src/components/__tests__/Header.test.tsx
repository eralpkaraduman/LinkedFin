// @vitest-environment jsdom
import { fireEvent, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { renderWithProviders } from "#/test/render";
import Header from "../Header";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@tanstack/react-router")>();
	return { ...actual, useNavigate: () => navigate };
});

/** The single `search` updater the component handed to `navigate`. */
function lastSearchUpdate(prev: Record<string, unknown> = {}) {
	const call = navigate.mock.calls.at(-1)?.[0];
	return (call.search as (p: Record<string, unknown>) => unknown)(prev);
}

beforeEach(() => {
	navigate.mockClear();
});

test("renders search input and brand link", async () => {
	renderWithProviders(<Header />);
	expect(
		await screen.findByPlaceholderText(/search fish names/i),
	).toBeInTheDocument();
	expect(screen.getByRole("link", { name: /LinkedFin/i })).toBeInTheDocument();
});

test("typing into search shows the clear button", async () => {
	renderWithProviders(<Header />);
	const input = await screen.findByPlaceholderText(/search fish names/i);

	await userEvent.type(input, "salmon");

	expect(screen.getByText("Clear")).toBeInTheDocument();
});

test("clicking the clear button empties the input", async () => {
	renderWithProviders(<Header />);
	const input = (await screen.findByPlaceholderText(
		/search fish names/i,
	)) as HTMLInputElement;
	await userEvent.type(input, "salmon");
	expect(input.value).toBe("salmon");

	await userEvent.click(screen.getByText("Clear"));
	expect(input.value).toBe("");
});

test("seeds the input from the q search param", async () => {
	renderWithProviders(<Header />, { initialPath: "/?q=perch" });
	const input = (await screen.findByPlaceholderText(
		/search fish names/i,
	)) as HTMLInputElement;

	expect(input.value).toBe("perch");
});

test("the search box is never dimmed or inert", async () => {
	// `?name=` / `?species=` used to open modals and dim the search box. Detail
	// views are file routes now (/name/$id, /species/$id), no route validates
	// these params, and typing here navigates back to "/" — so nothing, least of
	// all a stale param someone pasted, may disable the input.
	renderWithProviders(<Header />, {
		initialPath: "/?name=nm_0001&species=sp_0001",
	});
	const input = await screen.findByPlaceholderText(/search fish names/i);
	const container = input.closest("div");

	expect(container?.className).not.toContain("opacity-40");
	expect(container?.hasAttribute("inert")).toBe(false);
});

describe("URL sync", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	/**
	 * Renders on real timers — the router needs a real tick to mount its route —
	 * then switches to fake ones so the 300ms debounce can be stepped through.
	 * Uses fireEvent rather than userEvent: userEvent's own timer plumbing does
	 * not survive swapping in fake timers mid-test.
	 */
	const typeInto = async (value: string) => {
		renderWithProviders(<Header />);
		const input = await screen.findByPlaceholderText(/search fish names/i);
		vi.useFakeTimers();
		fireEvent.change(input, { target: { value } });
	};

	test("debounces the URL sync by 300ms", async () => {
		await typeInto("cod");

		vi.advanceTimersByTime(299);
		expect(navigate).not.toHaveBeenCalled();

		vi.advanceTimersByTime(1);
		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith(
			expect.objectContaining({ to: "/", replace: true }),
		);
		expect(lastSearchUpdate()).toEqual({ q: "cod", page: undefined });
	});

	test("a new query resets the table back to page 1", async () => {
		await typeInto("cod");
		vi.advanceTimersByTime(300);

		expect(lastSearchUpdate({ q: "pike", page: 4, sort: "name" })).toEqual({
			q: "cod",
			page: undefined,
			sort: "name",
		});
	});

	test("clearing the input drops q from the URL", async () => {
		await typeInto("cod");
		vi.advanceTimersByTime(300);
		navigate.mockClear();

		fireEvent.click(screen.getByText("Clear"));
		vi.advanceTimersByTime(300);

		expect(navigate).toHaveBeenCalledTimes(1);
		expect(lastSearchUpdate({ q: "cod", page: 2 })).toEqual({
			q: undefined,
			page: undefined,
		});
	});
});
