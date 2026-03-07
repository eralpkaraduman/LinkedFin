import { Link } from "@tanstack/react-router";
import { useDatabase } from "#/lib/DatabaseContext";
import { buildChain, getRelationsForName } from "#/lib/relations";
import type { FishName } from "#/lib/types";

interface NameDetailProps {
	name: FishName;
	onNavigate?: (id: string) => void;
}

export function NameDetail({ name, onNavigate }: NameDetailProps) {
	const { relations, getNameById, getNamesBySpecies } = useDatabase();

	const sizeChain = buildChain(name.id, "smaller_than", relations);
	const alternates = buildChain(name.id, "alternate_of", relations);
	const {
		borrowedFrom,
		lentTo,
		confusedWith,
		maleOf,
		femaleOf,
		hasMale,
		hasFemale,
	} = getRelationsForName(name.id, relations);
	const sameSpecies = getNamesBySpecies(name.species_id);

	const NameLink = ({
		id,
		children,
		className = "",
	}: {
		id: string;
		children: React.ReactNode;
		className?: string;
	}) => {
		if (onNavigate) {
			return (
				<button
					type="button"
					onClick={() => onNavigate(id)}
					className={`cursor-pointer ${className}`}
				>
					{children}
				</button>
			);
		}
		return (
			<Link to="/name/$id" params={{ id }} className={className}>
				{children}
			</Link>
		);
	};

	const NameCard = ({
		item,
		isCurrent,
		subtitle,
	}: {
		item: FishName;
		isCurrent: boolean;
		subtitle: string;
	}) => {
		const card = (
			<div
				className={`flex min-w-[100px] flex-col rounded-lg px-3 py-2 text-center ${
					isCurrent
						? "border-2 border-foreground/50 bg-muted"
						: "bg-muted/50 hover:bg-muted"
				}`}
			>
				<span className="text-sm font-medium">{item.name}</span>
				<span className="text-xs text-muted-foreground">{subtitle}</span>
			</div>
		);

		if (isCurrent) return card;
		return (
			<NameLink id={item.id} className="cursor-pointer">
				{card}
			</NameLink>
		);
	};

	return (
		<div className="space-y-4">
			{/* Meta info */}
			<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
				<span>#{name.id}</span>
				<span>📍 {name.region}</span>
			</div>

			{/* Fields grid */}
			{(name.language ||
				name.measurement_unit ||
				name.transliteration ||
				name.phonetic) && (
				<div className="rounded-lg bg-muted/50 p-4 text-sm">
					<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
						{name.language && (
							<>
								<dt className="text-muted-foreground">Language</dt>
								<dd className="font-medium">{name.language}</dd>
							</>
						)}
						{name.measurement_unit && (
							<>
								<dt className="text-muted-foreground">Measurement</dt>
								<dd className="font-medium">
									{name.measurement_min} — {name.measurement_max || "∞"}{" "}
									{name.measurement_unit}
								</dd>
							</>
						)}
						{name.transliteration && (
							<>
								<dt className="text-muted-foreground">Transliteration</dt>
								<dd className="font-mono font-medium">
									{name.transliteration}
								</dd>
							</>
						)}
						{name.phonetic && !name.phonetic.startsWith("[") && (
							<>
								<dt className="text-muted-foreground">IPA</dt>
								<dd className="font-serif">{name.phonetic}</dd>
							</>
						)}
					</dl>
				</div>
			)}

			{/* Etymology */}
			<div className="rounded-lg bg-muted/50 p-4">
				<p className="cursor-text select-text whitespace-pre-line text-sm">
					{name.etymology || "Origin uncertain"}
				</p>
			</div>

			{/* Species notes */}
			{name.species_notes && (
				<p className="border-l-2 border-muted-foreground/30 pl-3 text-sm text-muted-foreground">
					{name.species_notes}
				</p>
			)}

			{/* Size progression chain */}
			{sizeChain.length > 1 && (
				<div className="space-y-3">
					<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Progression
					</h3>
					<div className="flex flex-wrap items-center gap-2">
						{sizeChain.map((id, i) => {
							const n = getNameById(id);
							if (!n) return null;
							const isCurrent = id === name.id;
							const sizeText = n.measurement_unit
								? `${n.measurement_min}–${n.measurement_max || "∞"} ${n.measurement_unit}`
								: "";
							return (
								<div key={id} className="flex items-center gap-2">
									<NameCard
										item={n}
										isCurrent={isCurrent}
										subtitle={sizeText}
									/>
									{i < sizeChain.length - 1 && (
										<span className="text-muted-foreground">→</span>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Alternates */}
			{alternates.length > 1 && (
				<div className="text-sm">
					<span className="text-muted-foreground">Alternates: </span>
					{alternates
						.filter((id) => id !== name.id)
						.map((id, i, arr) => {
							const n = getNameById(id);
							if (!n) return null;
							return (
								<span key={id}>
									<NameLink id={id} className="text-primary hover:underline">
										{n.name}
									</NameLink>
									<span className="text-muted-foreground"> ({n.region})</span>
									{i < arr.length - 1 && ", "}
								</span>
							);
						})}
				</div>
			)}

			{/* Borrowed from */}
			{borrowedFrom.length > 0 && (
				<div className="text-sm">
					<span className="text-muted-foreground">Borrowed from: </span>
					{borrowedFrom.map((rel, i) => {
						const n = getNameById(rel.target_id);
						if (!n) return null;
						return (
							<span key={rel.target_id}>
								<NameLink
									id={rel.target_id}
									className="text-primary hover:underline"
								>
									{n.name}
								</NameLink>
								{i < borrowedFrom.length - 1 && ", "}
							</span>
						);
					})}
				</div>
			)}

			{/* Lent to */}
			{lentTo.length > 0 && (
				<div className="text-sm">
					<span className="text-muted-foreground">Lent to: </span>
					{lentTo.map((rel, i) => {
						const n = getNameById(rel.source_id);
						if (!n) return null;
						return (
							<span key={rel.source_id}>
								<NameLink
									id={rel.source_id}
									className="text-primary hover:underline"
								>
									{n.name}
								</NameLink>
								{i < lentTo.length - 1 && ", "}
							</span>
						);
					})}
				</div>
			)}

			{/* Confused with */}
			{confusedWith.length > 0 && (
				<div className="text-sm text-amber-600 dark:text-amber-400">
					<span>⚠️ Often confused with: </span>
					{confusedWith.map((rel, i) => {
						const otherId =
							rel.source_id === name.id ? rel.target_id : rel.source_id;
						const n = getNameById(otherId);
						if (!n) return null;
						return (
							<span key={otherId}>
								<NameLink
									id={otherId}
									className="text-amber-600 hover:underline dark:text-amber-400"
								>
									{n.name}
								</NameLink>
								<span> ({n.scientific_name})</span>
								{i < confusedWith.length - 1 && ", "}
							</span>
						);
					})}
				</div>
			)}

			{/* Male of */}
			{maleOf.length > 0 && (
				<div className="text-sm">
					<span className="text-muted-foreground">Male of: </span>
					{maleOf.map((rel, i) => {
						const n = getNameById(rel.target_id);
						if (!n) return null;
						return (
							<span key={rel.target_id}>
								<NameLink
									id={rel.target_id}
									className="text-primary hover:underline"
								>
									{n.name}
								</NameLink>
								{i < maleOf.length - 1 && ", "}
							</span>
						);
					})}
				</div>
			)}

			{/* Female of */}
			{femaleOf.length > 0 && (
				<div className="text-sm">
					<span className="text-muted-foreground">Female of: </span>
					{femaleOf.map((rel, i) => {
						const n = getNameById(rel.target_id);
						if (!n) return null;
						return (
							<span key={rel.target_id}>
								<NameLink
									id={rel.target_id}
									className="text-primary hover:underline"
								>
									{n.name}
								</NameLink>
								{i < femaleOf.length - 1 && ", "}
							</span>
						);
					})}
				</div>
			)}

			{/* Has male/female variants */}
			{(hasMale.length > 0 || hasFemale.length > 0) && (
				<div className="text-sm">
					<span className="text-muted-foreground">Sex variants: </span>
					{hasMale.map((rel) => {
						const n = getNameById(rel.source_id);
						if (!n) return null;
						return (
							<span key={rel.source_id}>
								<NameLink
									id={rel.source_id}
									className="text-primary hover:underline"
								>
									{n.name}
								</NameLink>
								<span className="text-muted-foreground"> (male)</span>
								{hasFemale.length > 0 && ", "}
							</span>
						);
					})}
					{hasFemale.map((rel) => {
						const n = getNameById(rel.source_id);
						if (!n) return null;
						return (
							<span key={rel.source_id}>
								<NameLink
									id={rel.source_id}
									className="text-primary hover:underline"
								>
									{n.name}
								</NameLink>
								<span className="text-muted-foreground"> (female)</span>
							</span>
						);
					})}
				</div>
			)}

			{/* Same species, different names */}
			{sameSpecies.length > 1 && (
				<div className="space-y-3">
					<h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
						Same species, different names
					</h3>
					<div className="flex flex-wrap gap-2">
						{sameSpecies.map((n) => (
							<NameCard
								key={n.id}
								item={n}
								isCurrent={n.id === name.id}
								subtitle={n.region}
							/>
						))}
					</div>
				</div>
			)}

			{/* Report Issue link */}
			<div className="border-t border-border pt-4 text-center">
				<a
					href={`https://github.com/eralpkaraduman/LinkedFin/issues/new?title=${encodeURIComponent(`[${name.id}] ${name.name}: `)}&body=${encodeURIComponent(`**Name ID:** ${name.id}\n**Name:** ${name.name}\n**Scientific name:** ${name.scientific_name}\n\n**Issue:**\n`)}`}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground"
				>
					<svg
						viewBox="0 0 16 16"
						width="14"
						height="14"
						fill="currentColor"
						aria-hidden="true"
					>
						<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
					</svg>
					Report an issue with this entry
				</a>
			</div>

			{/* Bottom spacer with safe area */}
			<div className="min-h-[calc(1rem+env(safe-area-inset-bottom,0px))]" />
		</div>
	);
}
