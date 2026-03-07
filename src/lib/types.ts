import type { Names, NameRelations } from "../db/types"

/**
 * FishName extends the generated Names type with computed/joined fields.
 * - Omits region_id (replaced by region name from JOIN)
 * - Adds fields from species JOIN
 * - Adds computed language display name
 */
export interface FishName extends Omit<Names, "region_id" | "notes"> {
  region: string // from regions.name (JOIN)
  scientific_name: string // from species.scientific_name (JOIN)
  species_notes?: string | null // from species.notes (JOIN)
  language: string // computed from lang code via Intl.DisplayNames
}

// Re-export relation type from db/relations
import type { NameRelationTypeValue } from "../db/relations"
export type RelationType = NameRelationTypeValue

/**
 * Relation extends NameRelations with typed relation field
 */
export interface Relation extends Omit<NameRelations, "relation" | "notes"> {
  relation: RelationType
}

export interface DatabaseState {
  names: FishName[]
  relations: Relation[]
  isLoading: boolean
  error: string | null
}
