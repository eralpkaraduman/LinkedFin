import Fuse, { type IFuseOptions } from "fuse.js";
import { useMemo } from "react";
import { useDatabase } from "#/lib/DatabaseContext";
import type { FishName } from "#/lib/types";

const fuseOptions: IFuseOptions<FishName> = {
	keys: [
		{ name: "name", weight: 1 },
		{ name: "transliteration", weight: 0.8 },
		{ name: "phonetic", weight: 0.6 },
		{ name: "scientific_name", weight: 0.5 },
		{ name: "region", weight: 0.4 },
		{ name: "language", weight: 0.4 },
	],
	threshold: 0.4,
	distance: 100,
	includeScore: true,
	ignoreLocation: true,
};

export interface SearchResult {
	item: FishName;
	score?: number;
}

export function useSearch(query: string): FishName[] | SearchResult[] {
	const { names } = useDatabase();

	const fuse = useMemo(() => new Fuse(names, fuseOptions), [names]);

	return useMemo(() => {
		if (!query.trim()) {
			return names;
		}
		return fuse.search(query);
	}, [query, fuse, names]);
}

export function isSearchResult(
	item: FishName | SearchResult,
): item is SearchResult {
	return "item" in item && "score" in item;
}

export function getItem(result: FishName | SearchResult): FishName {
	return isSearchResult(result) ? result.item : result;
}
