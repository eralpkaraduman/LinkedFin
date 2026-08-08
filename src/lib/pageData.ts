/**
 * Pure projections from the full dataset down to what one page needs.
 *
 * Route loaders run these and the result is dehydrated into the prerendered
 * HTML, so every byte here is paid 620 times over. They deliberately return a
 * *slice* — the name plus the handful of entries it links to — rather than the
 * whole 512-name table, which would put ~250 KB of JSON in every document.
 *
 * Keeping them pure (data in, data out, no `import.meta.env`, no database)
 * makes them testable in plain Node and reusable from either environment.
 */

import {
	getNameSiblings,
	getSpeciesSiblings,
	type Sibling,
} from "#/hooks/useSiblingNavigation";
import type { FishData } from "#/lib/fishData";
import { buildChain } from "#/lib/relations";
import type { FishName, NameTableRow, Relation } from "#/lib/types";

export interface NamePageData {
	name: FishName;
	/** Only the relations whose two endpoints are both in `related`. */
	relations: Relation[];
	/** Every name reachable from this one: chains, borrowings, same species. */
	related: FishName[];
	prev: Sibling | null;
	next: Sibling | null;
}

export interface SpeciesPageData {
	id: string;
	scientificName: string;
	notes: string | null;
	names: FishName[];
	prev: Sibling | null;
	next: Sibling | null;
}

/** One entry in the homepage's region browse list. */
export interface RegionSummary {
	id: string;
	name: string;
	/** Names in this region. Rendered next to the label so thin ones are obvious. */
	count: number;
}

export interface RegionPageData {
	id: string;
	name: string;
	/** Every name in the region — see the no-pagination note on the route. */
	names: NameTableRow[];
}

/** Relation types whose chains are rendered transitively by `NameDetail`. */
const CHAIN_RELATIONS = ["smaller_than", "alternate_of"] as const;

export function selectNamePage(
	data: FishData,
	id: string,
): NamePageData | null {
	const name = data.names.find((n) => n.id === id);
	if (!name) return null;

	// The closure NameDetail can reach: the transitive chains it walks, its
	// direct relations in both directions, and the other names of its species.
	const ids = new Set<string>([id]);
	for (const relation of CHAIN_RELATIONS) {
		for (const chained of buildChain(id, relation, data.relations)) {
			ids.add(chained);
		}
	}
	for (const relation of data.relations) {
		if (relation.source_id === id) ids.add(relation.target_id);
		else if (relation.target_id === id) ids.add(relation.source_id);
	}
	for (const candidate of data.names) {
		if (candidate.species_id === name.species_id) ids.add(candidate.id);
	}

	const { prev, next } = getNameSiblings(data.names, id);

	// `ids` can name entries that no longer exist — a relation may point at a
	// deleted id. Resolve against the real names so the page never ships a
	// relation whose other end it cannot render.
	const related = data.names.filter((n) => ids.has(n.id));
	const present = new Set(related.map((n) => n.id));

	return {
		name,
		relations: data.relations.filter(
			(r) => present.has(r.source_id) && present.has(r.target_id),
		),
		related,
		prev,
		next,
	};
}

export function selectSpeciesPage(
	data: FishData,
	id: string,
): SpeciesPageData | null {
	const names = data.names.filter((n) => n.species_id === id);
	if (names.length === 0) return null;

	const { prev, next } = getSpeciesSiblings(data.names, id);

	return {
		id,
		scientificName: names[0].scientific_name,
		notes: names[0].species_notes ?? null,
		names,
		prev,
		next,
	};
}

/** Only the columns `NamesTable` renders — see `NameTableRow`. */
function toTableRow(name: FishName): NameTableRow {
	return {
		id: name.id,
		name: name.name,
		lang: name.lang,
		transliteration: name.transliteration,
		region: name.region,
		scientific_name: name.scientific_name,
	};
}

/**
 * Every region that has at least one name, with its count.
 *
 * Derived from the names rather than from a regions table so it needs no extra
 * data source, and so a region with nothing in it can never produce a link to
 * an empty page. Twenty-three rows of `{id, name, count}` — this is what the
 * homepage dehydrates, not the 512 names behind them.
 */
export function selectRegionList(data: FishData): RegionSummary[] {
	const byId = new Map<string, RegionSummary>();
	for (const name of data.names) {
		const existing = byId.get(name.region_id);
		if (existing) existing.count += 1;
		else
			byId.set(name.region_id, {
				id: name.region_id,
				name: name.region,
				count: 1,
			});
	}
	return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "en"));
}

export function selectRegionPage(
	data: FishData,
	id: string,
): RegionPageData | null {
	const names = data.names.filter((n) => n.region_id === id);
	if (names.length === 0) return null;
	return { id, name: names[0].region, names: names.map(toTableRow) };
}

function collapse(text: string): string {
	return text.replace(/\s+/g, " ").trim();
}

/** Trim to `max` characters on a word boundary, appending an ellipsis. */
export function truncate(text: string, max: number): string {
	const value = collapse(text);
	if (value.length <= max) return value;
	const cut = value.lastIndexOf(" ", max - 1);
	return `${value.slice(0, cut > 0 ? cut : max)}…`;
}

/**
 * Google cuts a snippet around 155 characters and shows roughly 60 of a title,
 * so both put the page-specific words first. "Kalamar — LinkedFin", never
 * "LinkedFin … | Kalamar", which would bury the one word that distinguishes
 * this page from the other 619.
 */
export function namePageMeta(page: NamePageData): {
	title: string;
	description: string;
} {
	const { name } = page;
	const etymology = collapse(name.etymology ?? "");
	const lead = `${name.name} is the ${name.language} name for ${name.scientific_name} in ${name.region}.`;
	return {
		/**
		 * The language is in the title because the name alone is not unique:
		 * Finnish and Estonian both call Perca fluviatilis "Ahven", Norwegian and
		 * Danish both call Clupea harengus "Sild", and six such pairs would
		 * otherwise ship byte-identical titles.
		 */
		title: `${name.name} — ${name.language} name for ${name.scientific_name} | LinkedFin`,
		description: truncate(etymology ? `${lead} ${etymology}` : lead, 300),
	};
}

/**
 * These pages exist to answer "Turkish fish names", "Greek fish names" — so the
 * region leads the title and the words a searcher typed follow immediately.
 */
export function regionPageMeta(page: RegionPageData): {
	title: string;
	description: string;
} {
	const count = page.names.length;
	const lead = `${count} fish ${count === 1 ? "name" : "names"} from ${page.name}, with etymology, transliteration and pronunciation.`;
	const names = page.names.map((n) => n.name).join(", ");
	return {
		title: `${page.name} — fish names and etymology | LinkedFin`,
		description: truncate(`${lead} ${names}`, 300),
	};
}

export function speciesPageMeta(page: SpeciesPageData): {
	title: string;
	description: string;
} {
	const names = page.names.map((n) => n.name).join(", ");
	const lead = `${page.scientificName} is called ${names}.`;
	return {
		title: `${page.scientificName} — fish names and etymology | LinkedFin`,
		description: truncate(page.notes ? `${lead} ${page.notes}` : lead, 300),
	};
}
