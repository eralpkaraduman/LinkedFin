import type { NameRelations, Names } from "../db/types";

/**
 * FishName extends the generated Names type with computed/joined fields.
 * - Keeps region_id (the /region/$id route filters on it) and adds the region
 *   name from the JOIN alongside it
 * - Adds fields from species JOIN
 * - Adds computed language display name
 */
export interface FishName extends Names {
	region: string; // from regions.name (JOIN)
	scientific_name: string; // from species.scientific_name (JOIN)
	species_notes?: string | null; // from species.notes (JOIN)
	language: string; // computed from lang code via Intl.DisplayNames
}

/**
 * The columns `NamesTable` actually renders.
 *
 * A separate, narrower type because `/region/$id` dehydrates every row of a
 * region into its HTML (108 of them for International). Etymology, phonetic and
 * the measurement triple are not on screen there, and shipping them would
 * roughly quadruple that payload. `FishName` is assignable to this, so the
 * homepage keeps passing its full rows unchanged.
 */
export type NameTableRow = Pick<
	FishName,
	"id" | "name" | "lang" | "transliteration" | "region" | "scientific_name"
>;

// Re-export relation type from db/relations
import type { NameRelationTypeValue } from "../db/relations";
export type RelationType = NameRelationTypeValue;

/**
 * Relation extends NameRelations with typed relation field
 */
export interface Relation extends Omit<NameRelations, "relation" | "notes"> {
	relation: RelationType;
}

export interface DatabaseState {
	names: FishName[];
	relations: Relation[];
	isLoading: boolean;
	error: string | null;
}
