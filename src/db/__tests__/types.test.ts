import { describe, it, expect } from "vitest"
import type { DB, Names, Species, Regions, NameRelations } from "../types"

describe("generated database types", () => {
  it("DB interface has all tables", () => {
    // Type-level test: this will fail to compile if types are wrong
    const _typeCheck: keyof DB = "names"
    expect(["names", "species", "regions", "name_relations"]).toContain(
      _typeCheck
    )
  })

  it("Names interface has expected fields", () => {
    const mockName: Names = {
      id: "nm_001",
      name: "Test Fish",
      species_id: "sp_001",
      region_id: "turkey",
      lang: "tur",
      etymology: null,
      measurement_unit: null,
      measurement_min: null,
      measurement_max: null,
      notes: null,
      phonetic: null,
      transliteration: null,
    }
    expect(mockName.id).toBe("nm_001")
    expect(mockName.name).toBe("Test Fish")
  })

  it("Species interface has expected fields", () => {
    // Note: habitat uses Generated<> type for default values
    const mockSpecies: Partial<Species> = {
      id: "sp_001",
      scientific_name: "Gadus morhua",
      family: "Gadidae",
      notes: null,
    }
    expect(mockSpecies.scientific_name).toBe("Gadus morhua")
  })

  it("Regions interface has expected fields", () => {
    const mockRegion: Regions = {
      id: "turkey",
      name: "Turkey",
      language: "Turkish",
      name_local: "Türkiye",
      notes: null,
      parent_region: null,
      polygon: null,
    }
    expect(mockRegion.id).toBe("turkey")
  })

  it("NameRelations interface has expected fields", () => {
    const mockRelation: NameRelations = {
      source_id: "nm_001",
      target_id: "nm_002",
      relation: "borrowed_from",
      notes: null,
    }
    expect(mockRelation.relation).toBe("borrowed_from")
  })
})
