// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { DatabaseContext } from "#/lib/DatabaseContext";
import type { FishName } from "#/lib/types";
import { useSearch } from "../useSearch";

const sampleNames: FishName[] = [
	{
		id: "nm_0001",
		name: "Salmon",
		lang: "eng",
		transliteration: "Salmon",
		phonetic: "ˈsæmən",
		etymology: "From Latin salmo.",
		measurement_unit: null,
		measurement_min: null,
		measurement_max: null,
		species_id: "sp_001",
		region_id: "england",
		region: "England",
		scientific_name: "Salmo salar",
		species_notes: null,
		language: "English",
	},
	{
		id: "nm_0002",
		name: "Levrek",
		lang: "tur",
		transliteration: "Levrek",
		phonetic: "lev.ˈɾek",
		etymology: "From Greek labrax.",
		measurement_unit: null,
		measurement_min: null,
		measurement_max: null,
		species_id: "sp_002",
		region_id: "turkey",
		region: "Turkey",
		scientific_name: "Dicentrarchus labrax",
		species_notes: null,
		language: "Turkish",
	},
];

function wrapper({ children }: { children: ReactNode }) {
	return (
		<DatabaseContext.Provider
			value={{
				names: sampleNames,
				relations: [],
				isLoading: false,
				error: null,
				status: "",
				getNameById: () => undefined,
				getNamesBySpecies: () => [],
				getSpeciesInfo: () => undefined,
			}}
		>
			{children}
		</DatabaseContext.Provider>
	);
}

test("returns all names when query is empty", () => {
	const { result } = renderHook(() => useSearch(""), { wrapper });
	expect(result.current).toEqual(sampleNames);
});

test("returns all names when query is whitespace only", () => {
	const { result } = renderHook(() => useSearch("   "), { wrapper });
	expect(result.current).toEqual(sampleNames);
});

test("matches by name (fuzzy)", () => {
	const { result } = renderHook(() => useSearch("salmon"), { wrapper });
	const items = result.current as Array<{ item: FishName }>;
	expect(items.length).toBeGreaterThan(0);
	expect(items[0].item.id).toBe("nm_0001");
});

test("matches by scientific name", () => {
	const { result } = renderHook(() => useSearch("Dicentrarchus"), { wrapper });
	const items = result.current as Array<{ item: FishName }>;
	expect(items[0].item.id).toBe("nm_0002");
});

test("getItem unwraps SearchResult and passes through plain FishName", async () => {
	const { getItem } = await import("../useSearch");
	const wrapped = { item: sampleNames[0], score: 0.1 };
	expect(getItem(wrapped)).toBe(sampleNames[0]);
	expect(getItem(sampleNames[1])).toBe(sampleNames[1]);
});
