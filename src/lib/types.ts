export interface FishName {
  id: string
  name: string
  lang: string
  transliteration?: string
  phonetic?: string
  etymology?: string
  measurement_unit?: string
  measurement_min?: number
  measurement_max?: number
  species_id: string
  region: string
  scientific_name: string
  species_notes?: string
  language: string // Computed from lang code
}

export type RelationType =
  | "borrowed_from"
  | "alternate_of"
  | "confused_with"
  | "smaller_than"
  | "male_of"
  | "female_of"

export interface Relation {
  source_id: string
  target_id: string
  relation: RelationType
}

export interface DatabaseState {
  names: FishName[]
  relations: Relation[]
  isLoading: boolean
  error: string | null
}
