import { useMemo } from "react";
import { useDatabase } from "#/lib/DatabaseContext";
import type { FishName } from "#/lib/types";

/**
 * Sibling navigation (previous/next) for the name and species detail views.
 *
 * The order is intentionally *not* the randomized order the search table shows.
 * It is derived from the full name list with a deterministic comparator so the
 * same entry always has the same neighbours, regardless of shuffling, the
 * current search query, or the environment's locale:
 *
 * - names: sorted by `name`, tie-broken by `id`
 * - species: unique species, sorted by `scientific_name`, tie-broken by `id`
 *
 * Comparison is plain code-unit comparison (not `localeCompare`), which matches
 * SQLite's BINARY collation used by `ORDER BY names.name` in `initDatabase`.
 */

export interface Sibling {
	id: string;
	label: string;
}

export interface SiblingNavigation {
	prev: Sibling | null;
	next: Sibling | null;
	/** 1-based position of the current entry, 0 when it is not in the list. */
	position: number;
	total: number;
}

const EMPTY: SiblingNavigation = {
	prev: null,
	next: null,
	position: 0,
	total: 0,
};

function compare(a: Sibling, b: Sibling): number {
	if (a.label !== b.label) return a.label < b.label ? -1 : 1;
	if (a.id === b.id) return 0;
	return a.id < b.id ? -1 : 1;
}

function siblingsOf(list: Sibling[], currentId: string): SiblingNavigation {
	const index = list.findIndex((entry) => entry.id === currentId);
	if (index === -1) return { ...EMPTY, total: list.length };
	// A single-entry list has no siblings to browse to.
	if (list.length < 2) {
		return { prev: null, next: null, position: 1, total: list.length };
	}
	return {
		prev: list[(index - 1 + list.length) % list.length],
		next: list[(index + 1) % list.length],
		position: index + 1,
		total: list.length,
	};
}

/** Deterministically ordered list of every name. */
export function buildNameOrder(names: FishName[]): Sibling[] {
	return names.map((n) => ({ id: n.id, label: n.name })).sort(compare);
}

/** Deterministically ordered list of every distinct species. */
export function buildSpeciesOrder(names: FishName[]): Sibling[] {
	const seen = new Map<string, Sibling>();
	for (const n of names) {
		if (!seen.has(n.species_id)) {
			seen.set(n.species_id, { id: n.species_id, label: n.scientific_name });
		}
	}
	return [...seen.values()].sort(compare);
}

export function getNameSiblings(
	names: FishName[],
	currentId: string,
): SiblingNavigation {
	return siblingsOf(buildNameOrder(names), currentId);
}

export function getSpeciesSiblings(
	names: FishName[],
	currentSpeciesId: string,
): SiblingNavigation {
	return siblingsOf(buildSpeciesOrder(names), currentSpeciesId);
}

export function useNameSiblings(currentId: string): SiblingNavigation {
	const { names } = useDatabase();
	const order = useMemo(() => buildNameOrder(names), [names]);
	return useMemo(() => siblingsOf(order, currentId), [order, currentId]);
}

export function useSpeciesSiblings(
	currentSpeciesId: string,
): SiblingNavigation {
	const { names } = useDatabase();
	const order = useMemo(() => buildSpeciesOrder(names), [names]);
	return useMemo(
		() => siblingsOf(order, currentSpeciesId),
		[order, currentSpeciesId],
	);
}
