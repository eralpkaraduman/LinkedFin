/**
 * Page-number list generation for the results pagination control.
 *
 * Pages are 1-based. "ellipsis" entries mark elided ranges and are rendered
 * with `<PaginationEllipsis />`.
 */

export type PageItem = number | "ellipsis-start" | "ellipsis-end";

/**
 * Build the list of page buttons to render.
 *
 * Always includes the first and last page, plus `siblingCount` pages either
 * side of the current page. Gaps are collapsed into ellipsis markers.
 *
 * The window of numbered pages keeps a constant width, so near the first or
 * last page it extends inwards rather than collapsing — otherwise page 1 of 52
 * would offer no way to reach page 3 except one step at a time.
 */
export function getPageItems(
	currentPage: number,
	pageCount: number,
	siblingCount = 1,
): PageItem[] {
	if (pageCount <= 0) return [];

	const current = Math.min(Math.max(currentPage, 1), pageCount);

	// first + last + current + 2 siblings + 2 ellipses
	const maxSlots = siblingCount * 2 + 5;
	if (pageCount <= maxSlots) {
		return Array.from({ length: pageCount }, (_, i) => i + 1);
	}

	// Width of the numbered run between the first and last page.
	const windowSize = siblingCount * 2 + 1;
	// Slide the window so it stays fully inside 2..pageCount-1 at both ends.
	const left = Math.min(
		Math.max(current - siblingCount, 2),
		pageCount - windowSize,
	);
	const right = left + windowSize - 1;

	const items: PageItem[] = [1];

	if (left > 2) {
		items.push("ellipsis-start");
	}

	for (let page = left; page <= right; page++) {
		items.push(page);
	}

	if (right < pageCount - 1) {
		items.push("ellipsis-end");
	}

	items.push(pageCount);

	return items;
}

/**
 * Human-readable range for the current page, e.g. `{ from: 1, to: 25 }`.
 * Returns zeroes when there are no rows.
 */
export function getPageRange(
	pageIndex: number,
	pageSize: number,
	totalRows: number,
): { from: number; to: number } {
	if (totalRows <= 0) return { from: 0, to: 0 };
	const from = pageIndex * pageSize + 1;
	const to = Math.min((pageIndex + 1) * pageSize, totalRows);
	return { from: Math.min(from, totalRows), to };
}
