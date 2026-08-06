import { getPageItems, getPageRange } from "#/lib/pagination";

describe("getPageItems", () => {
	test("returns an empty list when there are no pages", () => {
		expect(getPageItems(1, 0)).toEqual([]);
	});

	test("lists every page when the count fits without ellipses", () => {
		expect(getPageItems(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	test("elides the tail when near the first page", () => {
		expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, "ellipsis-end", 20]);
	});

	test("elides the head when near the last page", () => {
		expect(getPageItems(20, 20)).toEqual([1, "ellipsis-start", 17, 18, 19, 20]);
	});

	test("offers the same number of page buttons on every page", () => {
		const counts = new Set<number>();
		for (let page = 1; page <= 52; page++) {
			counts.add(
				getPageItems(page, 52).filter((item) => typeof item === "number")
					.length,
			);
		}
		expect([...counts]).toEqual([5]);
	});

	test("offers a jump target beyond the immediate neighbour on page 1", () => {
		// Regression: the window used to collapse to [1, 2, …, 52] on page 1,
		// leaving no way to reach page 3 other than stepping.
		expect(getPageItems(1, 52)).toContain(3);
	});

	test("elides both sides in the middle", () => {
		expect(getPageItems(10, 20)).toEqual([
			1,
			"ellipsis-start",
			9,
			10,
			11,
			"ellipsis-end",
			20,
		]);
	});

	test("never emits duplicate page numbers at the boundaries", () => {
		for (let page = 1; page <= 20; page++) {
			const items = getPageItems(page, 20).filter(
				(item): item is number => typeof item === "number",
			);
			expect(new Set(items).size).toBe(items.length);
			expect(items[0]).toBe(1);
			expect(items[items.length - 1]).toBe(20);
		}
	});

	test("clamps an out-of-range current page", () => {
		expect(getPageItems(0, 5)).toEqual([1, 2, 3, 4, 5]);
		expect(getPageItems(99, 5)).toEqual([1, 2, 3, 4, 5]);
	});

	test("honours a wider sibling count", () => {
		expect(getPageItems(10, 30, 2)).toEqual([
			1,
			"ellipsis-start",
			8,
			9,
			10,
			11,
			12,
			"ellipsis-end",
			30,
		]);
	});
});

describe("getPageRange", () => {
	test("returns zeroes with no rows", () => {
		expect(getPageRange(0, 25, 0)).toEqual({ from: 0, to: 0 });
	});

	test("describes the first page", () => {
		expect(getPageRange(0, 25, 476)).toEqual({ from: 1, to: 25 });
	});

	test("describes a middle page", () => {
		expect(getPageRange(2, 25, 476)).toEqual({ from: 51, to: 75 });
	});

	test("clamps the last, partial page", () => {
		expect(getPageRange(19, 25, 476)).toEqual({ from: 476, to: 476 });
	});
});
