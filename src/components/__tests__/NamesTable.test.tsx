// @vitest-environment jsdom
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { NamesTable } from "#/components/NamesTable";
import type { FishName } from "#/lib/types";
import { renderWithProviders } from "#/test/render";

function makeName(index: number): FishName {
	const padded = String(index).padStart(4, "0");
	return {
		id: `nm_${padded}`,
		name: `Name ${padded}`,
		species_id: `sp_${padded}`,
		lang: "eng",
		etymology: `Etymology ${padded}`,
		transliteration: `Translit ${padded}`,
		phonetic: `fon ${padded}`,
		region_id: `region-${padded}`,
		region: `Region ${padded}`,
		scientific_name: `Scientificus ${padded}`,
		language: "English",
		measurement_max: null,
		measurement_min: null,
		measurement_unit: null,
	};
}

const rows = Array.from({ length: 60 }, (_, i) => makeName(i + 1));

/**
 * Pagination behaviour is asserted against a pinned page size so these tests
 * stay meaningful if the product default changes.
 */
const TEST_PAGE_SIZE = 25;

function renderTable(
	props: Partial<Parameters<typeof NamesTable>[0]> = {},
	initialPath?: string,
) {
	const onShuffle = vi.fn();
	const onRowSelect = vi.fn();
	const utils = renderWithProviders(
		<NamesTable
			data={rows}
			isSearch={false}
			randomSeed={1234}
			onShuffle={onShuffle}
			onRowSelect={onRowSelect}
			pageSize={TEST_PAGE_SIZE}
			{...props}
		/>,
		initialPath ? { initialPath } : undefined,
	);
	return { ...utils, onShuffle, onRowSelect };
}

/** Row names currently rendered in the table body, in display order. */
function visibleNames(): string[] {
	const bodyRows = document.querySelectorAll(
		"[data-slot='table-body'] [data-slot='table-row']",
	);
	return Array.from(bodyRows).map(
		(row) =>
			row.querySelector("[data-slot='table-cell']")?.textContent?.trim() ?? "",
	);
}

describe("result count", () => {
	test("shows the page range and the full total so the list size is obvious", async () => {
		renderTable();
		expect(await screen.findByTestId("result-count")).toHaveTextContent(
			"1–25 of 60 names",
		);
	});

	test("reports an empty result set", async () => {
		renderTable({ data: [] });
		expect(await screen.findByTestId("result-count")).toHaveTextContent(
			"No names found",
		);
		expect(screen.getAllByText("No names found").length).toBeGreaterThan(1);
	});
});

describe("pagination", () => {
	test("renders only one page of rows at a time", async () => {
		renderTable();
		await screen.findByTestId("result-count");
		expect(visibleNames()).toHaveLength(25);
	});

	test("previous is disabled on the first page", async () => {
		renderTable();
		const previous = await screen.findByLabelText("Go to previous page");
		expect(previous).toHaveAttribute("aria-disabled", "true");
		expect(await screen.findByLabelText("Go to next page")).toHaveAttribute(
			"aria-disabled",
			"false",
		);
	});

	test("next advances a page and updates the range", async () => {
		const user = userEvent.setup();
		renderTable();
		const firstPageNames = visibleNames();

		await user.click(await screen.findByLabelText("Go to next page"));

		expect(screen.getByTestId("result-count")).toHaveTextContent(
			"26–50 of 60 names",
		);
		expect(visibleNames()).toHaveLength(25);
		// No overlap with page 1 — the random order must be stable across pages.
		expect(
			visibleNames().filter((name) => firstPageNames.includes(name)),
		).toEqual([]);
	});

	test("clicking a numbered page jumps straight to it", async () => {
		const user = userEvent.setup();
		renderTable();
		const nav = await screen.findByRole("navigation", { name: "pagination" });
		await user.click(within(nav).getByRole("link", { name: "3" }));

		expect(screen.getByTestId("result-count")).toHaveTextContent(
			"51–60 of 60 names",
		);
		// Last page is partial.
		expect(visibleNames()).toHaveLength(10);
	});

	test("next is disabled on the last page and previous goes back", async () => {
		const user = userEvent.setup();
		renderTable();
		const nav = await screen.findByRole("navigation", { name: "pagination" });

		await user.click(within(nav).getByRole("link", { name: "3" }));
		expect(screen.getByLabelText("Go to next page")).toHaveAttribute(
			"aria-disabled",
			"true",
		);

		// Clicking a disabled next must not move past the end.
		await user.click(screen.getByLabelText("Go to next page"));
		expect(screen.getByTestId("result-count")).toHaveTextContent(
			"51–60 of 60 names",
		);

		await user.click(screen.getByLabelText("Go to previous page"));
		expect(screen.getByTestId("result-count")).toHaveTextContent(
			"26–50 of 60 names",
		);
	});

	test("clicking a disabled previous stays on the first page", async () => {
		const user = userEvent.setup();
		renderTable();
		await user.click(await screen.findByLabelText("Go to previous page"));
		expect(screen.getByTestId("result-count")).toHaveTextContent(
			"1–25 of 60 names",
		);
	});

	test("hides the pagination nav when everything fits on one page", async () => {
		renderTable({ data: rows.slice(0, 5) });
		await screen.findByTestId("result-count");
		expect(screen.queryByRole("navigation", { name: "pagination" })).toBeNull();
	});

	test("resets to the first page when the result set shrinks", async () => {
		const user = userEvent.setup();

		function Harness() {
			const [data, setData] = useState(rows);
			return (
				<>
					<button type="button" onClick={() => setData(rows.slice(0, 30))}>
						shrink
					</button>
					<NamesTable
						data={data}
						isSearch={false}
						randomSeed={1234}
						onShuffle={() => {}}
						onRowSelect={() => {}}
						pageSize={TEST_PAGE_SIZE}
					/>
				</>
			);
		}

		renderWithProviders(<Harness />);
		const nav = await screen.findByRole("navigation", { name: "pagination" });
		await user.click(within(nav).getByRole("link", { name: "3" }));
		expect(screen.getByTestId("result-count")).toHaveTextContent("51–60");

		await user.click(screen.getByRole("button", { name: "shrink" }));

		expect(screen.getByTestId("result-count")).toHaveTextContent(
			"1–25 of 30 names",
		);
		expect(visibleNames()).toHaveLength(25);
	});

	test("renders the page given by the controlled `page` prop", async () => {
		renderTable({ page: 3, onPageChange: vi.fn() });
		expect(await screen.findByTestId("result-count")).toHaveTextContent(
			"51–60 of 60 names",
		);
	});

	test("reports page changes to the parent instead of paging itself", async () => {
		const user = userEvent.setup();
		const onPageChange = vi.fn();
		renderTable({ page: 1, onPageChange });

		const nav = await screen.findByRole("navigation", { name: "pagination" });
		await user.click(within(nav).getByRole("link", { name: "2" }));

		expect(onPageChange).toHaveBeenCalledWith(2);
		// Still on page 1 — the parent owns the state (here, the URL).
		expect(screen.getByTestId("result-count")).toHaveTextContent("1–25");
	});

	test("clamps an out-of-range controlled page onto the last page", async () => {
		renderTable({ page: 99, onPageChange: vi.fn() });
		expect(await screen.findByTestId("result-count")).toHaveTextContent(
			"51–60 of 60 names",
		);
		expect(visibleNames()).toHaveLength(10);
	});

	test("page links carry a real href that keeps the other search params", async () => {
		renderTable(
			{ page: 2, onPageChange: vi.fn() },
			"/?q=perch&sort=region&dir=desc",
		);
		const nav = await screen.findByRole("navigation", { name: "pagination" });

		expect(within(nav).getByRole("link", { name: "3" })).toHaveAttribute(
			"href",
			"/?q=perch&sort=region&dir=desc&page=3",
		);
		expect(screen.getByLabelText("Go to next page")).toHaveAttribute(
			"href",
			"/?q=perch&sort=region&dir=desc&page=3",
		);
		// Page 1 is the bare URL, matching what the router navigates to.
		expect(screen.getByLabelText("Go to previous page")).toHaveAttribute(
			"href",
			"/?q=perch&sort=region&dir=desc",
		);
	});

	test("clicking a page link navigates in-app rather than following the href", async () => {
		const onPageChange = vi.fn();
		renderTable({ page: 1, onPageChange });
		const nav = await screen.findByRole("navigation", { name: "pagination" });

		const link = within(nav).getByRole("link", { name: "2" });
		const click = new MouseEvent("click", { bubbles: true, cancelable: true });
		link.dispatchEvent(click);

		expect(click.defaultPrevented).toBe(true);
		expect(onPageChange).toHaveBeenCalledWith(2);
	});

	test("keeps a dead href when the table pages itself", async () => {
		renderTable();
		const nav = await screen.findByRole("navigation", { name: "pagination" });
		// Uncontrolled: the page lives in component state, so `?page=` would not
		// restore it and there is nothing honest to link to.
		expect(within(nav).getByRole("link", { name: "2" })).toHaveAttribute(
			"href",
			"#",
		);
	});

	test("reports sort changes to the parent instead of sorting itself", async () => {
		const user = userEvent.setup();
		const onSortChange = vi.fn();
		renderTable({ sort: "default", onSortChange });

		await screen.findByTestId("result-count");
		await user.click(screen.getByRole("button", { name: /^Region/ }));

		expect(onSortChange).toHaveBeenCalledWith("region", false);
	});

	test("random order is identical for the same seed across mounts", async () => {
		const first = renderTable();
		await screen.findByTestId("result-count");
		const firstOrder = visibleNames();
		first.unmount();

		renderTable();
		await screen.findByTestId("result-count");
		expect(visibleNames()).toEqual(firstOrder);
	});

	test("a new seed reshuffles the order", async () => {
		const first = renderTable();
		await screen.findByTestId("result-count");
		const firstOrder = visibleNames();
		first.unmount();

		renderTable({ randomSeed: 999 });
		await screen.findByTestId("result-count");
		expect(visibleNames()).not.toEqual(firstOrder);
	});
});

describe("sort mode", () => {
	test("labels the default mode Random when browsing, and offers shuffle", async () => {
		const { onShuffle } = renderTable();
		const user = userEvent.setup();
		const trigger = await screen.findByLabelText("Sort order");
		expect(trigger).toHaveTextContent("Random");

		await user.click(screen.getByTitle("Reshuffle"));
		expect(onShuffle).toHaveBeenCalledTimes(1);
	});

	test("labels the default mode Relevance when searching and hides shuffle", async () => {
		renderTable({ isSearch: true });
		expect(await screen.findByLabelText("Sort order")).toHaveTextContent(
			"Relevance",
		);
		expect(screen.queryByTitle("Reshuffle")).toBeNull();
	});

	test("the sort editor switches modes and back to random", async () => {
		const user = userEvent.setup();
		renderTable();

		await user.click(await screen.findByLabelText("Sort order"));
		await user.click(await screen.findByRole("option", { name: "Region" }));

		expect(screen.getByLabelText("Sort order")).toHaveTextContent("Region");
		expect(visibleNames()[0]).toBe("Name 0001");
		expect(screen.queryByTitle("Reshuffle")).toBeNull();

		await user.click(screen.getByLabelText("Sort order"));
		await user.click(await screen.findByRole("option", { name: "Random" }));

		expect(screen.getByLabelText("Sort order")).toHaveTextContent("Random");
		expect(screen.getByTitle("Reshuffle")).toBeInTheDocument();
	});

	test("the sort editor resets to the first page", async () => {
		const user = userEvent.setup();
		renderTable();
		const nav = await screen.findByRole("navigation", { name: "pagination" });
		await user.click(within(nav).getByRole("link", { name: "3" }));

		await user.click(screen.getByLabelText("Sort order"));
		await user.click(await screen.findByRole("option", { name: "Name" }));

		expect(screen.getByTestId("result-count")).toHaveTextContent(
			"1–25 of 60 names",
		);
	});

	test("clicking a column header sorts by it and drops out of random mode", async () => {
		const user = userEvent.setup();
		renderTable();
		await user.click(await screen.findByRole("button", { name: /^Name/ }));

		expect(visibleNames()[0]).toBe("Name 0001");
		expect(screen.getByLabelText("Sort order")).toHaveTextContent("Name");
		// Shuffle only makes sense while the random order is active.
		expect(screen.queryByTitle("Reshuffle")).toBeNull();
	});

	test("a second click reverses the sort direction", async () => {
		const user = userEvent.setup();
		renderTable();
		const header = await screen.findByRole("button", { name: /^Name/ });

		await user.click(header);
		expect(visibleNames()[0]).toBe("Name 0001");

		await user.click(header);
		expect(visibleNames()[0]).toBe("Name 0060");
	});

	test("a third click clears the sort and returns to random order", async () => {
		const user = userEvent.setup();
		renderTable();
		const header = await screen.findByRole("button", { name: /^Name/ });

		await user.click(header);
		await user.click(header);
		await user.click(header);

		expect(screen.getByLabelText("Sort order")).toHaveTextContent("Random");
		expect(screen.getByTitle("Reshuffle")).toBeInTheDocument();
	});

	test("sorting resets to the first page", async () => {
		const user = userEvent.setup();
		renderTable();
		const nav = await screen.findByRole("navigation", { name: "pagination" });
		await user.click(within(nav).getByRole("link", { name: "3" }));
		expect(screen.getByTestId("result-count")).toHaveTextContent("51–60");

		await user.click(screen.getByRole("button", { name: /^Region/ }));
		expect(screen.getByTestId("result-count")).toHaveTextContent(
			"1–25 of 60 names",
		);
	});

	test("sorting by species orders on the scientific name", async () => {
		const user = userEvent.setup();
		renderTable();
		await user.click(await screen.findByRole("button", { name: /^Species/ }));

		const lastCells = document.querySelectorAll(
			"[data-slot='table-body'] [data-slot='table-row'] [data-slot='table-cell']:last-child",
		);
		expect(lastCells[0]?.textContent).toBe("Scientificus 0001");
	});

	test("sorting by transliteration orders on that column", async () => {
		const user = userEvent.setup();
		renderTable();
		await user.click(
			await screen.findByRole("button", { name: /^Transliteration/ }),
		);
		expect(visibleNames()[0]).toBe("Name 0001");
	});

	test("marks the sorted column with aria-sort", async () => {
		const user = userEvent.setup();
		renderTable();
		await user.click(await screen.findByRole("button", { name: /^Name/ }));

		const nameHeader = screen.getByRole("columnheader", { name: /^Name/ });
		expect(nameHeader).toHaveAttribute("aria-sort", "ascending");
		expect(
			screen.getByRole("columnheader", { name: /^Region/ }),
		).toHaveAttribute("aria-sort", "none");
	});
});

describe("rows", () => {
	test("selecting a row reports the underlying record", async () => {
		const user = userEvent.setup();
		const { onRowSelect } = renderTable();
		await user.click(await screen.findByRole("button", { name: /^Name/ }));

		const firstRow = document.querySelector(
			"[data-slot='table-body'] [data-slot='table-row']",
		) as HTMLElement;
		await user.click(firstRow);

		expect(onRowSelect).toHaveBeenCalledWith(
			expect.objectContaining({ id: "nm_0001", name: "Name 0001" }),
		);
	});

	test("the name cell is a real link to the detail page", async () => {
		const user = userEvent.setup();
		renderTable();
		await user.click(await screen.findByRole("button", { name: /^Name/ }));

		const link = screen.getByRole("link", { name: "Name 0001" });
		expect(link).toHaveAttribute("href", "/name/nm_0001");
		expect(
			document.querySelectorAll(
				"[data-slot='table-body'] [data-slot='table-row'] a[href^='/name/']",
			),
		).toHaveLength(25);
	});

	/**
	 * Regression: the row used to be made clickable by stretching the name
	 * link across it with an absolutely positioned `::after`. That needs the
	 * `<tr>` to be a containing block, which WebKit does not honour, so every
	 * overlay resolved against the `relative` scroll container instead — on
	 * Safari all of them covered the whole table and the last row's, being
	 * last in paint order, swallowed every click. Clicking any cell of any row
	 * has to reach that row's own detail page.
	 */
	test("clicking a non-link cell opens that row, not the last one", async () => {
		const user = userEvent.setup();
		const { router } = renderTable();
		await user.click(await screen.findByRole("button", { name: /^Name/ }));

		const thirdRow = document.querySelectorAll(
			"[data-slot='table-body'] [data-slot='table-row']",
		)[2] as HTMLElement;
		const plainCell = within(thirdRow).getByText("Translit 0003");

		await user.click(plainCell);

		expect(router.state.location.pathname).toBe("/name/nm_0003");
	});

	test("Tab reaches a row link and Enter activates it", async () => {
		const user = userEvent.setup();
		const { onRowSelect } = renderTable();
		await user.click(await screen.findByRole("button", { name: /^Name/ }));

		const link = screen.getByRole("link", { name: "Name 0001" });
		link.focus();
		expect(document.activeElement).toBe(link);

		// Tab moves on to the next row's link rather than skipping the body.
		await user.tab();
		expect(document.activeElement).toBe(
			screen.getByRole("link", { name: "Name 0002" }),
		);

		await user.tab({ shift: true });
		await user.keyboard("{Enter}");
		expect(onRowSelect).toHaveBeenCalledWith(
			expect.objectContaining({ id: "nm_0001" }),
		);
	});

	test("renders a Clear button only when a clear handler is supplied", async () => {
		const onClearSearch = vi.fn();
		const user = userEvent.setup();
		renderTable({ isSearch: true, onClearSearch });

		await user.click(await screen.findByTitle("Clear search"));
		expect(onClearSearch).toHaveBeenCalledTimes(1);
	});

	test("has no Clear button when browsing", async () => {
		renderTable();
		await screen.findByTestId("result-count");
		expect(screen.queryByTitle("Clear search")).toBeNull();
	});
});
