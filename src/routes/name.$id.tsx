import { createFileRoute, Link } from "@tanstack/react-router";
import {
	ArrowLeftIcon,
	CheckIcon,
	CopyIcon,
	EllipsisVerticalIcon,
	ShareIcon,
} from "lucide-react";
import { useState } from "react";
import { NameDetail } from "#/components/NameDetail";
import { SpeciesCard } from "#/components/SpeciesCard";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { useDatabase } from "#/lib/DatabaseContext";

export const Route = createFileRoute("/name/$id")({
	component: DetailPage,
});

function DetailPage() {
	const { id } = Route.useParams();
	const { getNameById } = useDatabase();
	const [copied, setCopied] = useState(false);

	const name = getNameById(id);

	const copyLink = async () => {
		await navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const share = () => {
		if (name) {
			navigator.share({
				title: `LinkedFin: ${name.name}`,
				text: name.etymology || name.scientific_name,
				url: window.location.href,
			});
		}
	};

	if (!name) {
		return (
			<main className="page-wrap px-4 py-8">
				<div className="text-center">
					<p className="mb-4 text-muted-foreground">Name not found: {id}</p>
					<Link to="/" search={{}} className="text-primary hover:underline">
						Back to search
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="page-wrap px-4 py-8">
			<div className="mx-auto max-w-2xl">
				<div className="mb-6 flex items-start justify-between gap-4">
					<div>
						<Link
							to="/"
							search={{}}
							className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
						>
							<ArrowLeftIcon className="h-4 w-4" />
							Back to search
						</Link>
						<h1 className="text-2xl font-bold">{name.name}</h1>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<EllipsisVerticalIcon className="h-4 w-4" />
								<span className="sr-only">Actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={copyLink}>
								{copied ? (
									<CheckIcon className="text-green-500" />
								) : (
									<CopyIcon />
								)}
								{copied ? "Copied!" : "Copy link"}
							</DropdownMenuItem>
							{typeof navigator !== "undefined" && navigator.share && (
								<DropdownMenuItem onClick={share}>
									<ShareIcon />
									Share
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>

				<div className="space-y-4">
					<SpeciesCard
						speciesId={name.species_id}
						scientificName={name.scientific_name}
					/>
					<NameDetail name={name} />
				</div>
			</div>
		</main>
	);
}
