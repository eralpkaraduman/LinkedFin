import type { FishData } from "#/lib/fishData";
import {
	namePageMeta,
	selectNamePage,
	selectSpeciesPage,
	speciesPageMeta,
	truncate,
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

test("name meta front-loads the name and includes the etymology", () => {
	const page = selectNamePage(data, "nm_0001");
	if (!page) throw new Error("expected a page");
	const { title, description } = namePageMeta(page);
	expect(title.startsWith("Levrek")).toBe(true);
	expect(title.endsWith("| LinkedFin")).toBe(true);
	expect(description).toContain("From Greek labrax.");
	expect(description.startsWith("Levrek")).toBe(true);
});

test("name meta still describes a name with no etymology", () => {
	const page = selectNamePage(
		{ names: [makeName({ etymology: "" })], relations: [] },
		"nm_0001",
	);
	if (!page) throw new Error("expected a page");
	expect(namePageMeta(page).description).toBe(
		"Levrek is the Turkish name for Dicentrarchus labrax in Turkey.",
	);
});

test("species meta lists the names and front-loads the scientific name", () => {
	const page = selectSpeciesPage(data, "sp_009");
	if (!page) throw new Error("expected a page");
	const { title, description } = speciesPageMeta(page);
	expect(title.startsWith("Pomatomus saltatrix")).toBe(true);
	expect(description).toContain("Lüfer");
	expect(description).toContain("A pelagic predator.");
});

test("truncate cuts on a word boundary and collapses whitespace", () => {
	expect(truncate("one   two\nthree", 100)).toBe("one two three");
	expect(truncate("aaa bbb ccc", 8)).toBe("aaa bbb…");
	// No space to break on: cut hard rather than return the whole string.
	expect(truncate("aaaaaaaaaa", 4)).toBe("aaaa…");
});
