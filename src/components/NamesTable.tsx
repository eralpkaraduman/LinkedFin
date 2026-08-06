import {
	createColumnHelper,
	createPaginatedRowModel,
	createSortedRowModel,
	type PaginationState,
	rowPaginationFeature,
	rowSortingFeature,
	type SortingState,
	sortFn_text,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import {
	ArrowDownIcon,
	ArrowUpDownIcon,
	ArrowUpIcon,
	ShuffleIcon,
	XIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "#/components/ui/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "#/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { getPageItems, getPageRange } from "#/lib/pagination";
import { shuffleWithSeed } from "#/lib/randomOrder";
import type { FishName } from "#/lib/types";

export const DEFAULT_PAGE_SIZE = 25;

/** Sort mode value used when no column sort is active. */
export const DEFAULT_SORT_VALUE = "default";

const SORTABLE_COLUMNS = [
	{ id: "name", label: "Name" },
	{ id: "transliteration", label: "Transliteration" },
	{ id: "region", label: "Region" },
	{ id: "species", label: "Species" },
] as const;

const RIGHT_ALIGNED = new Set<string>(["species"]);

const features = tableFeatures({
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
	sortFns: { text: sortFn_text },
	rowPaginationFeature,
	paginatedRowModel: createPaginatedRowModel(),
});

const columnHelper = createColumnHelper<typeof features, FishName>();

const columns = columnHelper.columns([
	columnHelper.accessor("name", {
		id: "name",
		header: "Name",
		sortFn: "text",
		cell: (info) => <span className="font-medium">{info.getValue()}</span>,
	}),
	columnHelper.accessor((row) => row.transliteration ?? "", {
		id: "transliteration",
		header: "Transliteration",
		sortFn: "text",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("region", {
		id: "region",
		header: "Region",
		sortFn: "text",
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor("scientific_name", {
		id: "species",
		header: "Species",
		sortFn: "text",
		cell: (info) => <span className="italic">{info.getValue()}</span>,
	}),
]);

export interface NamesTableProps {
	/** Rows to display, already filtered by the active search. */
	data: FishName[];
	/** True when `data` comes from a search (relevance order) rather than the full list. */
	isSearch: boolean;
	/** Seed driving the random order. Change it to reshuffle. */
	randomSeed: number;
	onShuffle: () => void;
	onRowSelect: (item: FishName) => void;
	/** When provided, a "Clear" button is shown in the toolbar. */
	onClearSearch?: () => void;
	pageSize?: number;
}

export function NamesTable({
	data,
	isSearch,
	randomSeed,
	onShuffle,
	onRowSelect,
	onClearSearch,
	pageSize = DEFAULT_PAGE_SIZE,
}: NamesTableProps) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize,
	});

	const isDefaultOrder = sorting.length === 0;
	// The default order is random when browsing and fuse.js relevance when searching.
	const isRandomOrder = isDefaultOrder && !isSearch;

	// Seeded shuffle keeps the same permutation across pages and re-renders.
	const orderedData = useMemo(
		() =>
			isRandomOrder
				? shuffleWithSeed(data, randomSeed, (item) => item.id)
				: data,
		[data, randomSeed, isRandomOrder],
	);

	const table = useTable({
		features,
		columns,
		data: orderedData,
		getRowId: (row) => row.id,
		state: { sorting, pagination },
		onSortingChange: setSorting,
		onPaginationChange: setPagination,
		enableSortingRemoval: true,
		enableMultiSort: false,
	});

	const rows = table.getRowModel().rows;
	const totalRows = orderedData.length;
	const pageCount = Math.max(1, Math.ceil(totalRows / pagination.pageSize));
	const currentPage = Math.min(pagination.pageIndex, pageCount - 1) + 1;
	const { from, to } = getPageRange(
		currentPage - 1,
		pagination.pageSize,
		totalRows,
	);
	const pageItems = useMemo(
		() => getPageItems(currentPage, pageCount),
		[currentPage, pageCount],
	);

	const goToPage = useCallback((page: number) => {
		setPagination((prev) => ({ ...prev, pageIndex: page - 1 }));
	}, []);

	const sortValue = sorting[0]?.id ?? DEFAULT_SORT_VALUE;
	const defaultSortLabel = isSearch ? "Relevance" : "Random";

	const selectItems = useMemo(
		() => ({
			[DEFAULT_SORT_VALUE]: defaultSortLabel,
			...Object.fromEntries(SORTABLE_COLUMNS.map((c) => [c.id, c.label])),
		}),
		[defaultSortLabel],
	);

	const handleSortModeChange = useCallback((value: unknown) => {
		const next = String(value);
		setSorting(next === DEFAULT_SORT_VALUE ? [] : [{ id: next, desc: false }]);
		setPagination((prev) => ({ ...prev, pageIndex: 0 }));
	}, []);

	return (
		<div className="flex flex-col gap-3">
			{/* Toolbar: result count + sort mode editor */}
			<div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
				<span data-testid="result-count">
					{totalRows === 0
						? "No names found"
						: `${from}–${to} of ${totalRows} names`}
				</span>

				<div className="flex items-center gap-1.5">
					<span className="hidden sm:inline">Sort</span>
					<Select
						value={sortValue}
						onValueChange={handleSortModeChange}
						items={selectItems}
					>
						<SelectTrigger size="sm" aria-label="Sort order">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={DEFAULT_SORT_VALUE}>
								{defaultSortLabel}
							</SelectItem>
							{SORTABLE_COLUMNS.map((column) => (
								<SelectItem key={column.id} value={column.id}>
									{column.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{isRandomOrder && (
						<button
							type="button"
							onClick={onShuffle}
							className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 transition hover:bg-muted hover:text-foreground"
							title="Reshuffle"
						>
							<ShuffleIcon className="h-3 w-3" />
							<span>Shuffle</span>
						</button>
					)}

					{onClearSearch && (
						<button
							type="button"
							onClick={onClearSearch}
							className="inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 transition hover:bg-muted hover:text-foreground"
							title="Clear search"
						>
							<XIcon className="h-3 w-3" />
							<span>Clear</span>
						</button>
					)}
				</div>
			</div>

			<div className="-mx-4 overflow-x-auto px-4">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									const sorted = header.column.getIsSorted();
									const alignRight = RIGHT_ALIGNED.has(header.column.id);
									return (
										<TableHead
											key={header.id}
											aria-sort={
												sorted === "asc"
													? "ascending"
													: sorted === "desc"
														? "descending"
														: "none"
											}
											className={alignRight ? "text-right" : undefined}
										>
											<button
												type="button"
												onClick={header.column.getToggleSortingHandler()}
												className={`inline-flex cursor-pointer items-center gap-1 rounded-md py-0.5 transition hover:text-foreground ${
													alignRight ? "flex-row-reverse" : ""
												}`}
											>
												<table.FlexRender header={header} />
												{sorted === "asc" ? (
													<ArrowUpIcon className="h-3 w-3" />
												) : sorted === "desc" ? (
													<ArrowDownIcon className="h-3 w-3" />
												) : (
													<ArrowUpDownIcon className="h-3 w-3 opacity-40" />
												)}
											</button>
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={SORTABLE_COLUMNS.length}
									className="py-6 text-center text-muted-foreground"
								>
									No names found
								</TableCell>
							</TableRow>
						) : (
							rows.map((row) => (
								<TableRow
									key={row.id}
									className="cursor-pointer"
									onClick={() => onRowSelect(row.original)}
								>
									{row.getAllCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={
												RIGHT_ALIGNED.has(cell.column.id)
													? "text-right"
													: undefined
											}
										>
											<table.FlexRender cell={cell} />
										</TableCell>
									))}
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{pageCount > 1 && (
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href="#"
								aria-disabled={currentPage === 1}
								tabIndex={currentPage === 1 ? -1 : undefined}
								className={
									currentPage === 1 ? "pointer-events-none opacity-50" : ""
								}
								onClick={(event) => {
									event.preventDefault();
									if (currentPage > 1) goToPage(currentPage - 1);
								}}
							/>
						</PaginationItem>

						{pageItems.map((item) =>
							typeof item === "number" ? (
								<PaginationItem key={item}>
									<PaginationLink
										href="#"
										isActive={item === currentPage}
										onClick={(event) => {
											event.preventDefault();
											goToPage(item);
										}}
									>
										{item}
									</PaginationLink>
								</PaginationItem>
							) : (
								<PaginationItem key={item}>
									<PaginationEllipsis />
								</PaginationItem>
							),
						)}

						<PaginationItem>
							<PaginationNext
								href="#"
								aria-disabled={currentPage === pageCount}
								tabIndex={currentPage === pageCount ? -1 : undefined}
								className={
									currentPage === pageCount
										? "pointer-events-none opacity-50"
										: ""
								}
								onClick={(event) => {
									event.preventDefault();
									if (currentPage < pageCount) goToPage(currentPage + 1);
								}}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	);
}
