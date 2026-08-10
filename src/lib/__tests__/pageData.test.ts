import type { FishData } from "#/lib/fishData";
import {
	selectNamePage,
	selectRegionList,
	selectRegionPage,
	selectSpeciesPage,
} from "#/lib/pageData";
import type { FishName, Relation } from "#/lib/types";

function makeName(over: Partial<FishName> = {}): FishName {
	return {
		id: "nm_0001",
		name: "Levrek",
		lang: "tur",
		transliteration: "Levrek",
		phonetic: "lev.ɾek",
		etymology: "From Greek labrax.",
		measurement_unit: null,
		measurement_min: null,
		measurement_max: null,
		species_id: "sp_001",
		region_id: "turkey",
		region: "Turkey",
		scientific_name: "Dicentrarchus labrax",
		species_notes: null,
		language: "Turkish",
		...over,
	};
}

const levrek = makeName();
const lavraki = makeName({
	id: "nm_0002",
	name: "Lavraki",
	region_id: "greek",
	region: "Greece",
	language: "Greek",
});
/** A different species entirely, linked to nothing. */
const lufer = makeName({
	id: "nm_0100",
	name: "Lüfer",
	species_id: "sp_009",
	scientific_name: "Pomatomus saltatrix",
	species_notes: "A pelagic predator.",
});

const relations: Relation[] = [
	{ source_id: "nm_0001", target_id: "nm_0002", relation: "alternate_of" },
	// Between two names that have nothing to do with nm_0001.
	{ source_id: "nm_0100", target_id: "nm_0999", relation: "borrowed_from" },
];

const data: FishData = { names: [levrek, lavraki, lufer], relations };

test("selectNamePage returns null for an unknown id", () => {
	expect(selectNamePage(data, "nm_nope")).toBeNull();
});

test("selectNamePage carries the name, its chain and its siblings", () => {
	const page = selectNamePage(data, "nm_0001");
	expect(page?.name.name).toBe("Levrek");
	expect(page?.related.map((n) => n.id).sort()).toEqual(["nm_0001", "nm_0002"]);
	// Deterministic order is by name: Lavraki, Levrek, Lüfer.
	expect(page?.prev?.id).toBe("nm_0002");
	expect(page?.next?.id).toBe("nm_0100");
});

test("selectNamePage drops relations that reach outside the page's names", () => {
	const page = selectNamePage(data, "nm_0001");
	expect(page?.relations).toEqual([relations[0]]);

	// nm_0999 is not in the dataset, so the borrowing must not be carried either.
	const other = selectNamePage(data, "nm_0100");
	expect(other?.relations).toEqual([]);
});

test("selectSpeciesPage groups every name of the species", () => {
	const page = selectSpeciesPage(data, "sp_001");
	expect(page?.scientificName).toBe("Dicentrarchus labrax");
	expect(page?.names.map((n) => n.name)).toEqual(["Levrek", "Lavraki"]);
	expect(selectSpeciesPage(data, "sp_404")).toBeNull();
});

test("selectSpeciesPage exposes the species notes", () => {
	expect(selectSpeciesPage(data, "sp_009")?.notes).toBe("A pelagic predator.");
	expect(selectSpeciesPage(data, "sp_001")?.notes).toBeNull();
});

test("selectRegionList counts every region and sorts by label", () => {
	expect(selectRegionList(data)).toEqual([
		{ id: "greek", name: "Greece", count: 1 },
		{ id: "turkey", name: "Turkey", count: 2 },
	]);
});

test("selectRegionPage returns every name of the region and nothing else", () => {
	const page = selectRegionPage(data, "turkey");
	expect(page?.name).toBe("Turkey");
	expect(page?.names.map((n) => n.name)).toEqual(["Levrek", "Lüfer"]);
	// Only the columns the table renders — the etymology stays out of the HTML.
	expect(page?.names[0]).not.toHaveProperty("etymology");
	expect(selectRegionPage(data, "atlantis")).toBeNull();
});
