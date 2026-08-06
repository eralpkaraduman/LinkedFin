import {
	buildNameOrder,
	buildSpeciesOrder,
	getNameSiblings,
	getSpeciesSiblings,
} from "#/hooks/useSiblingNavigation";
import type { FishName } from "#/lib/types";

function makeName(
	id: string,
	name: string,
	speciesId = "sp_001",
	scientificName = "Salmo salar",
): FishName {
	return {
		id,
		name,
		species_id: speciesId,
		scientific_name: scientificName,
	} as FishName;
}

// Deliberately out of order to prove the hook sorts rather than trusting input.
const names: FishName[] = [
	makeName("nm_0003", "Hauki", "sp_002", "Esox lucius"),
	makeName("nm_0001", "Ahven", "sp_003", "Perca fluviatilis"),
	makeName("nm_0002", "Lohi", "sp_001", "Salmo salar"),
	makeName("nm_0004", "Lohi", "sp_001", "Salmo salar"),
];

test("name order is alphabetical by name, tie-broken by id", () => {
	expect(buildNameOrder(names).map((s) => s.id)).toEqual([
		"nm_0001",
		"nm_0003",
		"nm_0002",
		"nm_0004",
	]);
});

test("name order is independent of the input order", () => {
	const shuffled = [names[2], names[0], names[3], names[1]];
	expect(buildNameOrder(shuffled)).toEqual(buildNameOrder(names));
});

test("returns the neighbouring names for a middle entry", () => {
	const { prev, next, position, total } = getNameSiblings(names, "nm_0003");
	expect(prev?.id).toBe("nm_0001");
	expect(next?.id).toBe("nm_0002");
	expect(position).toBe(2);
	expect(total).toBe(4);
});

test("wraps around to the last name when going back past the first", () => {
	const { prev, next } = getNameSiblings(names, "nm_0001");
	expect(prev?.id).toBe("nm_0004");
	expect(next?.id).toBe("nm_0003");
});

test("wraps around to the first name when going past the last", () => {
	const { prev, next } = getNameSiblings(names, "nm_0004");
	expect(prev?.id).toBe("nm_0002");
	expect(next?.id).toBe("nm_0001");
});

test("has no siblings for an unknown name", () => {
	const { prev, next, position } = getNameSiblings(names, "nm_9999");
	expect(prev).toBeNull();
	expect(next).toBeNull();
	expect(position).toBe(0);
});

test("has no siblings when the list holds a single entry", () => {
	const single = [makeName("nm_0001", "Ahven")];
	const { prev, next, position, total } = getNameSiblings(single, "nm_0001");
	expect(prev).toBeNull();
	expect(next).toBeNull();
	expect(position).toBe(1);
	expect(total).toBe(1);
});

test("species order deduplicates and sorts by scientific name", () => {
	expect(buildSpeciesOrder(names)).toEqual([
		{ id: "sp_002", label: "Esox lucius" },
		{ id: "sp_003", label: "Perca fluviatilis" },
		{ id: "sp_001", label: "Salmo salar" },
	]);
});

test("wraps around in both directions across species", () => {
	expect(getSpeciesSiblings(names, "sp_002").prev?.id).toBe("sp_001");
	expect(getSpeciesSiblings(names, "sp_001").next?.id).toBe("sp_002");
	expect(getSpeciesSiblings(names, "sp_003")).toMatchObject({
		prev: { id: "sp_002" },
		next: { id: "sp_001" },
		position: 2,
		total: 3,
	});
});
