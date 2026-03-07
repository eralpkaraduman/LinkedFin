import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CheckIcon, LinkIcon } from "lucide-react";
import { useDeferredValue, useState } from "react";
import { DetailModal } from "#/components/DetailModal";
import { NameDetail } from "#/components/NameDetail";
import { Button } from "#/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "#/components/ui/table";
import { getItem, useSearch } from "#/hooks/useSearch";
import { useDatabase } from "#/lib/DatabaseContext";

interface SearchParams {
	q?: string;
	id?: string; // Selected name ID for modal
}

export const Route = createFileRoute("/")({
	validateSearch: (search: Record<string, unknown>): SearchParams => ({
		q: typeof search.q === "string" ? search.q : undefined,
		id: typeof search.id === "string" ? search.id : undefined,
	}),
	component: HomePage,
});

function CopyLinkButton() {
	const [copied, setCopied] = useState(false);

	const copyLink = async () => {
		await navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={copyLink}
			title="Copy link"
			className="shrink-0"
		>
			{copied ? (
				<CheckIcon className="h-4 w-4 text-green-500" />
			) : (
				<LinkIcon className="h-4 w-4" />
			)}
		</Button>
	);
}

function HomePage() {
	const { q = "", id } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const { names, getNameById } = useDatabase();

	// Defer the search query so expensive Fuse.js search doesn't block UI
	const deferredQuery = useDeferredValue(q);
	const results = useSearch(deferredQuery);

	const selectedName = id ? getNameById(id) : null;

	const openDetail = (nameId: string) => {
		navigate({
			search: (prev) => ({ ...prev, id: nameId }),
		});
	};

	const closeDetail = () => {
		navigate({
			search: (prev) => ({ q: prev.q }), // Remove id, keep q
		});
	};

	const displayResults = results.map(getItem);

	return (
		<main className="page-wrap flex flex-col px-4 pb-8">
			<p className="my-3 text-xs text-muted-foreground">
				{q ? `${displayResults.length} results` : `${names.length} names`}
			</p>

			<div className="-mx-4 overflow-x-auto px-4">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Transliteration</TableHead>
							<TableHead>Region</TableHead>
							<TableHead>Species</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{displayResults.map((item) => (
							<TableRow
								key={item.id}
								className="cursor-pointer"
								onClick={() => openDetail(item.id)}
							>
								<TableCell className="font-medium">{item.name}</TableCell>
								<TableCell>{item.transliteration || ""}</TableCell>
								<TableCell>{item.region}</TableCell>
								<TableCell className="italic">{item.scientific_name}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<DetailModal
				open={!!selectedName}
				onOpenChange={(open) => !open && closeDetail()}
				title={selectedName?.name || ""}
				description={
					selectedName?.scientific_name && (
						<a
							href={`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(selectedName.scientific_name)}`}
							target="_blank"
							rel="noreferrer"
							className="underline underline-offset-2"
						>
							{selectedName.scientific_name}
						</a>
					)
				}
				action={<CopyLinkButton />}
			>
				{selectedName && (
					<NameDetail name={selectedName} onNavigate={openDetail} />
				)}
			</DetailModal>
		</main>
	);
}
