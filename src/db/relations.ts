/**
 * Name relation types and metadata for the fish names database.
 * This file provides type-safe constants and utilities for working with relations.
 */

export const NameRelationType = {
	ALTERNATE_OF: "alternate_of",
	BORROWED_FROM: "borrowed_from",
	SMALLER_THAN: "smaller_than",
	CONFUSED_WITH: "confused_with",
	MALE_OF: "male_of",
	FEMALE_OF: "female_of",
} as const;

export type NameRelationTypeValue =
	(typeof NameRelationType)[keyof typeof NameRelationType];

export interface RelationMeta {
	label: string;
	description: string;
	symmetric: boolean;
	transitive: boolean;
	sameSpecies: boolean;
	inverseLabel: string;
}

export const RelationMetadata: Record<NameRelationTypeValue, RelationMeta> = {
	alternate_of: {
		label: "Alternate of",
		description: "Alternative name for the same fish (e.g., dialectal variant)",
		symmetric: true,
		transitive: true,
		sameSpecies: true,
		inverseLabel: "Alternate of",
	},
	borrowed_from: {
		label: "Borrowed from",
		description: "Name borrowed from another language",
		symmetric: false,
		transitive: false,
		sameSpecies: true,
		inverseLabel: "Lent to",
	},
	smaller_than: {
		label: "Smaller than",
		description: "Name for smaller specimens of the same species",
		symmetric: false,
		transitive: true,
		sameSpecies: true,
		inverseLabel: "Larger than",
	},
	confused_with: {
		label: "Confused with",
		description: "Names commonly confused due to similar appearance or naming",
		symmetric: true,
		transitive: false,
		sameSpecies: false,
		inverseLabel: "Confused with",
	},
	male_of: {
		label: "Male of",
		description: "Name for male specimens (e.g., στειράδια for male κέφαλος)",
		symmetric: false,
		transitive: false,
		sameSpecies: true,
		inverseLabel: "Has male variant",
	},
	female_of: {
		label: "Female of",
		description: "Name for female specimens (e.g., μπάφες for female κέφαλος)",
		symmetric: false,
		transitive: false,
		sameSpecies: true,
		inverseLabel: "Has female variant",
	},
};

/**
 * Type guard to check if a string is a valid relation type
 */
export function isValidRelationType(
	value: string,
): value is NameRelationTypeValue {
	return Object.values(NameRelationType).includes(
		value as NameRelationTypeValue,
	);
}

/**
 * Get the inverse label for a relation type (used for displaying the other side)
 */
export function getInverseLabel(relationType: NameRelationTypeValue): string {
	return RelationMetadata[relationType].inverseLabel;
}

/**
 * Get metadata for a relation type
 */
export function getRelationMeta(
	relationType: NameRelationTypeValue,
): RelationMeta {
	return RelationMetadata[relationType];
}

/**
 * Check if a relation is symmetric (A→B implies B→A)
 */
export function isSymmetric(relationType: NameRelationTypeValue): boolean {
	return RelationMetadata[relationType].symmetric;
}

/**
 * Check if a relation is transitive (A→B and B→C implies A→C)
 */
export function isTransitive(relationType: NameRelationTypeValue): boolean {
	return RelationMetadata[relationType].transitive;
}

/**
 * Check if a relation requires same species
 */
export function requiresSameSpecies(
	relationType: NameRelationTypeValue,
): boolean {
	return RelationMetadata[relationType].sameSpecies;
}
