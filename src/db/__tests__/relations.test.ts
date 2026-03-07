import { describe, expect, it } from "vitest";
import {
	getInverseLabel,
	getRelationMeta,
	isSymmetric,
	isTransitive,
	isValidRelationType,
	NameRelationType,
	RelationMetadata,
	requiresSameSpecies,
} from "../relations";

describe("db/relations", () => {
	describe("NameRelationType constants", () => {
		it("has all expected relation types", () => {
			expect(NameRelationType.ALTERNATE_OF).toBe("alternate_of");
			expect(NameRelationType.BORROWED_FROM).toBe("borrowed_from");
			expect(NameRelationType.SMALLER_THAN).toBe("smaller_than");
			expect(NameRelationType.CONFUSED_WITH).toBe("confused_with");
			expect(NameRelationType.MALE_OF).toBe("male_of");
			expect(NameRelationType.FEMALE_OF).toBe("female_of");
		});
	});

	describe("RelationMetadata", () => {
		it("has metadata for all relation types", () => {
			const types = Object.values(NameRelationType);
			for (const type of types) {
				expect(RelationMetadata[type]).toBeDefined();
				expect(RelationMetadata[type].label).toBeDefined();
				expect(RelationMetadata[type].description).toBeDefined();
			}
		});

		it("alternate_of is symmetric and transitive", () => {
			expect(RelationMetadata.alternate_of.symmetric).toBe(true);
			expect(RelationMetadata.alternate_of.transitive).toBe(true);
		});

		it("borrowed_from is not symmetric", () => {
			expect(RelationMetadata.borrowed_from.symmetric).toBe(false);
		});

		it("confused_with allows different species", () => {
			expect(RelationMetadata.confused_with.sameSpecies).toBe(false);
		});
	});

	describe("isValidRelationType", () => {
		it("returns true for valid relation types", () => {
			expect(isValidRelationType("alternate_of")).toBe(true);
			expect(isValidRelationType("borrowed_from")).toBe(true);
			expect(isValidRelationType("male_of")).toBe(true);
		});

		it("returns false for invalid relation types", () => {
			expect(isValidRelationType("invalid")).toBe(false);
			expect(isValidRelationType("")).toBe(false);
			expect(isValidRelationType("ALTERNATE_OF")).toBe(false);
		});
	});

	describe("getInverseLabel", () => {
		it("returns inverse label for borrowed_from", () => {
			expect(getInverseLabel("borrowed_from")).toBe("Lent to");
		});

		it("returns same label for symmetric relations", () => {
			expect(getInverseLabel("alternate_of")).toBe("Alternate of");
			expect(getInverseLabel("confused_with")).toBe("Confused with");
		});

		it("returns inverse for sex variant relations", () => {
			expect(getInverseLabel("male_of")).toBe("Has male variant");
			expect(getInverseLabel("female_of")).toBe("Has female variant");
		});
	});

	describe("helper functions", () => {
		it("isSymmetric returns correct values", () => {
			expect(isSymmetric("alternate_of")).toBe(true);
			expect(isSymmetric("confused_with")).toBe(true);
			expect(isSymmetric("borrowed_from")).toBe(false);
			expect(isSymmetric("smaller_than")).toBe(false);
		});

		it("isTransitive returns correct values", () => {
			expect(isTransitive("alternate_of")).toBe(true);
			expect(isTransitive("smaller_than")).toBe(true);
			expect(isTransitive("confused_with")).toBe(false);
		});

		it("requiresSameSpecies returns correct values", () => {
			expect(requiresSameSpecies("alternate_of")).toBe(true);
			expect(requiresSameSpecies("confused_with")).toBe(false);
		});

		it("getRelationMeta returns full metadata", () => {
			const meta = getRelationMeta("male_of");
			expect(meta.label).toBe("Male of");
			expect(meta.description).toContain("male specimens");
			expect(meta.symmetric).toBe(false);
			expect(meta.inverseLabel).toBe("Has male variant");
		});
	});
});
