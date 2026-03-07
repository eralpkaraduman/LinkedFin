import { describe, it, expect } from "vitest"
import type { Names, Species, Regions, NameRelations } from "../../src/db/types"
import {
  validateNameIdFormat,
  validateSpeciesIdFormat,
  validateRegionIdFormat,
  validateNamesRequiredFields,
  validateSpeciesRequiredFields,
  validateRegionsRequiredFields,
  validateRelationsRequiredFields,
  validateLangFormat,
  validateTransliteration,
  validatePhonetic,
  validateEtymology,
  validateNamesToSpeciesFK,
  validateNamesToRegionsFK,
  validateRegionsParentFK,
  validateRelationsSourceFK,
  validateRelationsTargetFK,
  validateRelationTypes,
  validateSameSpeciesConstraint,
  validateNoOrphanedSpecies,
  validateNoOrphanedRegions,
  validateNoDuplicateNames,
  validateNoDuplicateRelations,
  validateNoSelfReferences,
  runAllValidations,
  createValidationContext,
} from "./validate-integrity"

// ═══════════════════════════════════════════════════════════════════════════
// TEST FIXTURES
// ═══════════════════════════════════════════════════════════════════════════

const validName = (overrides: Partial<Names> = {}): Names => ({
  id: "nm_0001",
  name: "Test Fish",
  species_id: "sp_001",
  region_id: "test-region",
  lang: "eng",
  transliteration: "test fish",
  phonetic: "test fish",
  etymology: "Test etymology",
  measurement_unit: null,
  measurement_min: null,
  measurement_max: null,
  notes: null,
  ...overrides,
})

const validSpecies = (overrides: Partial<Species> = {}): Species => ({
  id: "sp_001",
  scientific_name: "Testus fishus",
  family: null,
  habitat: null,
  notes: null,
  ...overrides,
})

const validRegion = (overrides: Partial<Regions> = {}): Regions => ({
  id: "test-region",
  name: "Test Region",
  language: "en",
  name_local: null,
  parent_region: null,
  polygon: null,
  notes: null,
  ...overrides,
})

const validRelation = (overrides: Partial<NameRelations> = {}): NameRelations => ({
  source_id: "nm_0001",
  target_id: "nm_0002",
  relation: "alternate_of",
  notes: null,
  ...overrides,
})

// ═══════════════════════════════════════════════════════════════════════════
// ID FORMAT TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("validateNameIdFormat", () => {
  it("passes for valid nm_XXXX format", () => {
    const names = [validName({ id: "nm_0001" }), validName({ id: "nm_9999" })]
    const result = validateNameIdFormat(names)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("fails for invalid ID formats", () => {
    const names = [
      validName({ id: "nm_001" }), // too short
      validName({ id: "nm_00001" }), // too long
      validName({ id: "name_0001" }), // wrong prefix
      validName({ id: "NM_0001" }), // uppercase
    ]
    const result = validateNameIdFormat(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toHaveLength(4)
  })
})

describe("validateSpeciesIdFormat", () => {
  it("passes for valid sp_XXX format", () => {
    const species = [validSpecies({ id: "sp_001" }), validSpecies({ id: "sp_999" })]
    const result = validateSpeciesIdFormat(species)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("fails for invalid ID formats", () => {
    const species = [
      validSpecies({ id: "sp_01" }), // too short
      validSpecies({ id: "sp_0001" }), // too long
      validSpecies({ id: "species_001" }), // wrong prefix
    ]
    const result = validateSpeciesIdFormat(species)
    expect(result.passed).toBe(false)
    expect(result.errors).toHaveLength(3)
  })
})

describe("validateRegionIdFormat", () => {
  it("passes for valid kebab-case format", () => {
    const regions = [
      validRegion({ id: "test-region" }),
      validRegion({ id: "turkish-aegean" }),
      validRegion({ id: "region123" }),
    ]
    const result = validateRegionIdFormat(regions)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("fails for invalid ID formats", () => {
    const regions = [
      validRegion({ id: "Test-Region" }), // uppercase
      validRegion({ id: "123-region" }), // starts with number
      validRegion({ id: "region_name" }), // underscore not allowed pattern-wise but actually matches [a-z0-9-], let me check
    ]
    const result = validateRegionIdFormat(regions)
    // Actually "region_name" would fail since _ is not in [a-z0-9-]
    expect(result.passed).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// REQUIRED FIELDS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("validateNamesRequiredFields", () => {
  it("passes when all required fields present", () => {
    const names = [validName()]
    const result = validateNamesRequiredFields(names)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("fails when name is missing", () => {
    const names = [validName({ name: "" })]
    const result = validateNamesRequiredFields(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("missing 'name'"))
  })

  it("fails when species_id is missing", () => {
    const names = [validName({ species_id: "" })]
    const result = validateNamesRequiredFields(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("missing 'species_id'"))
  })

  it("fails when region_id is missing", () => {
    const names = [validName({ region_id: "" })]
    const result = validateNamesRequiredFields(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("missing 'region_id'"))
  })
})

describe("validateSpeciesRequiredFields", () => {
  it("passes when scientific_name present", () => {
    const species = [validSpecies()]
    const result = validateSpeciesRequiredFields(species)
    expect(result.passed).toBe(true)
  })

  it("fails when scientific_name is missing", () => {
    const species = [validSpecies({ scientific_name: "" })]
    const result = validateSpeciesRequiredFields(species)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("missing 'scientific_name'"))
  })
})

describe("validateRegionsRequiredFields", () => {
  it("passes when all required fields present", () => {
    const regions = [validRegion()]
    const result = validateRegionsRequiredFields(regions)
    expect(result.passed).toBe(true)
  })

  it("fails when name is missing", () => {
    const regions = [validRegion({ name: "" })]
    const result = validateRegionsRequiredFields(regions)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("missing 'name'"))
  })

  it("fails when language is missing", () => {
    const regions = [validRegion({ language: "" })]
    const result = validateRegionsRequiredFields(regions)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("missing 'language'"))
  })
})

describe("validateRelationsRequiredFields", () => {
  it("passes when all required fields present", () => {
    const relations = [validRelation()]
    const result = validateRelationsRequiredFields(relations)
    expect(result.passed).toBe(true)
  })

  it("fails when source_id is missing", () => {
    const relations = [validRelation({ source_id: "" })]
    const result = validateRelationsRequiredFields(relations)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("missing 'source_id'"))
  })

  it("fails when target_id is missing", () => {
    const relations = [validRelation({ target_id: "" })]
    const result = validateRelationsRequiredFields(relations)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("missing 'target_id'"))
  })

  it("fails when relation type is missing", () => {
    const relations = [validRelation({ relation: "" })]
    const result = validateRelationsRequiredFields(relations)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("missing 'relation'"))
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// LANG, TRANSLITERATION, PHONETIC, ETYMOLOGY TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("validateLangFormat", () => {
  it("passes for valid ISO 639-3 codes", () => {
    const names = [
      validName({ lang: "eng" }),
      validName({ id: "nm_0002", lang: "ell" }),
      validName({ id: "nm_0003", lang: "tur" }),
    ]
    const result = validateLangFormat(names)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("fails for missing lang", () => {
    const names = [validName({ lang: null })]
    const result = validateLangFormat(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("missing 'lang'"))
  })

  it("fails for 2-letter codes", () => {
    const names = [validName({ lang: "en" })]
    const result = validateLangFormat(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("expected 3-letter ISO 639-3"))
  })

  it("fails for uppercase codes", () => {
    const names = [validName({ lang: "ENG" })]
    const result = validateLangFormat(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("expected 3-letter ISO 639-3"))
  })

  it("fails for 4+ letter codes", () => {
    const names = [validName({ lang: "engl" })]
    const result = validateLangFormat(names)
    expect(result.passed).toBe(false)
  })
})

describe("validateTransliteration", () => {
  it("passes when transliteration has value", () => {
    const names = [validName({ transliteration: "kefal" })]
    const result = validateTransliteration(names)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("passes without warning when transliteration is null for Latin-script languages", () => {
    const names = [
      validName({ transliteration: null, lang: "eng" }),
      validName({ id: "nm_0002", transliteration: null, lang: "tur" }),
      validName({ id: "nm_0003", transliteration: null, lang: "fin" }),
    ]
    const result = validateTransliteration(names)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it("passes with warning when transliteration is null for non-Latin script languages", () => {
    const names = [validName({ transliteration: null, lang: "ell" })] // Greek
    const result = validateTransliteration(names)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain("missing transliteration")
    expect(result.warnings[0]).toContain("ell")
  })

  it("fails when transliteration is empty string", () => {
    const names = [validName({ transliteration: "" })]
    const result = validateTransliteration(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("empty string"))
  })
})

describe("validatePhonetic", () => {
  it("passes for lowercase Latin phonetic", () => {
    const names = [
      validName({ phonetic: "ke-fal" }),
      validName({ id: "nm_0002", phonetic: "sar-dee-na" }),
    ]
    const result = validatePhonetic(names)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("passes for IPA notation", () => {
    const names = [
      validName({ phonetic: "/ˈpatlakɡœz meɾdʒan/" }),
      validName({ id: "nm_0002", phonetic: "/sinaɣrˈiða/" }),
    ]
    const result = validatePhonetic(names)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("passes for bracketed notation", () => {
    const names = [validName({ phonetic: "[large-eye dentex]" })]
    const result = validatePhonetic(names)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("passes with warning when phonetic is null", () => {
    const names = [validName({ phonetic: null })]
    const result = validatePhonetic(names)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain("missing phonetic")
  })

  it("fails when phonetic is empty string", () => {
    const names = [validName({ phonetic: "" })]
    const result = validatePhonetic(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("empty string"))
  })

  it("fails for uppercase letters outside brackets", () => {
    const names = [validName({ phonetic: "Ke-Fal" })]
    const result = validatePhonetic(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("uppercase"))
  })
})

describe("validateEtymology", () => {
  it("passes when etymology has value", () => {
    const names = [validName({ etymology: "From Greek kephalos meaning head" })]
    const result = validateEtymology(names)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("passes with warning when etymology is null", () => {
    const names = [validName({ etymology: null })]
    const result = validateEtymology(names)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain("missing etymology")
  })

  it("fails when etymology is empty string", () => {
    const names = [validName({ etymology: "" })]
    const result = validateEtymology(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("empty string"))
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// FOREIGN KEY TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("validateNamesToSpeciesFK", () => {
  it("passes when all species references exist", () => {
    const names = [validName({ species_id: "sp_001" })]
    const speciesIds = new Set(["sp_001", "sp_002"])
    const result = validateNamesToSpeciesFK(names, speciesIds)
    expect(result.passed).toBe(true)
  })

  it("fails when species reference does not exist", () => {
    const names = [validName({ species_id: "sp_999" })]
    const speciesIds = new Set(["sp_001"])
    const result = validateNamesToSpeciesFK(names, speciesIds)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("non-existent species"))
  })
})

describe("validateNamesToRegionsFK", () => {
  it("passes when all region references exist", () => {
    const names = [validName({ region_id: "test-region" })]
    const regionIds = new Set(["test-region", "other-region"])
    const result = validateNamesToRegionsFK(names, regionIds)
    expect(result.passed).toBe(true)
  })

  it("fails when region reference does not exist", () => {
    const names = [validName({ region_id: "nonexistent" })]
    const regionIds = new Set(["test-region"])
    const result = validateNamesToRegionsFK(names, regionIds)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("non-existent region"))
  })
})

describe("validateRegionsParentFK", () => {
  it("passes when no parent_region", () => {
    const regions = [validRegion({ parent_region: null })]
    const regionIds = new Set(["test-region"])
    const result = validateRegionsParentFK(regions, regionIds)
    expect(result.passed).toBe(true)
  })

  it("passes when parent_region exists", () => {
    const regions = [validRegion({ id: "child", parent_region: "parent" })]
    const regionIds = new Set(["child", "parent"])
    const result = validateRegionsParentFK(regions, regionIds)
    expect(result.passed).toBe(true)
  })

  it("fails when parent_region does not exist", () => {
    const regions = [validRegion({ parent_region: "nonexistent" })]
    const regionIds = new Set(["test-region"])
    const result = validateRegionsParentFK(regions, regionIds)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("non-existent parent region"))
  })
})

describe("validateRelationsSourceFK", () => {
  it("passes when source_id exists", () => {
    const relations = [validRelation({ source_id: "nm_0001" })]
    const nameIds = new Set(["nm_0001", "nm_0002"])
    const result = validateRelationsSourceFK(relations, nameIds)
    expect(result.passed).toBe(true)
  })

  it("fails when source_id does not exist", () => {
    const relations = [validRelation({ source_id: "nm_9999" })]
    const nameIds = new Set(["nm_0001"])
    const result = validateRelationsSourceFK(relations, nameIds)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("non-existent source"))
  })
})

describe("validateRelationsTargetFK", () => {
  it("passes when target_id exists", () => {
    const relations = [validRelation({ target_id: "nm_0002" })]
    const nameIds = new Set(["nm_0001", "nm_0002"])
    const result = validateRelationsTargetFK(relations, nameIds)
    expect(result.passed).toBe(true)
  })

  it("fails when target_id does not exist", () => {
    const relations = [validRelation({ target_id: "nm_9999" })]
    const nameIds = new Set(["nm_0001"])
    const result = validateRelationsTargetFK(relations, nameIds)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("non-existent target"))
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// RELATION TYPE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("validateRelationTypes", () => {
  it("passes for valid relation types", () => {
    const relations = [
      validRelation({ relation: "alternate_of" }),
      validRelation({ relation: "borrowed_from" }),
      validRelation({ relation: "confused_with" }),
      validRelation({ relation: "smaller_than" }),
      validRelation({ relation: "male_of" }),
      validRelation({ relation: "female_of" }),
    ]
    const result = validateRelationTypes(relations)
    expect(result.passed).toBe(true)
  })

  it("fails for invalid relation type", () => {
    const relations = [validRelation({ relation: "invalid_type" })]
    const result = validateRelationTypes(relations)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("Invalid relation type"))
  })
})

describe("validateSameSpeciesConstraint", () => {
  it("passes when same-species relations have matching species", () => {
    const relations = [validRelation({ source_id: "nm_0001", target_id: "nm_0002", relation: "alternate_of" })]
    const nameToSpecies = new Map([
      ["nm_0001", "sp_001"],
      ["nm_0002", "sp_001"], // same species
    ])
    const result = validateSameSpeciesConstraint(relations, nameToSpecies)
    expect(result.passed).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it("fails when same-species relations have different species", () => {
    const relations = [validRelation({ source_id: "nm_0001", target_id: "nm_0002", relation: "alternate_of" })]
    const nameToSpecies = new Map([
      ["nm_0001", "sp_001"],
      ["nm_0002", "sp_002"], // different species
    ])
    const result = validateSameSpeciesConstraint(relations, nameToSpecies)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("requires same species"))
  })

  it("allows confused_with between different species", () => {
    const relations = [validRelation({ source_id: "nm_0001", target_id: "nm_0002", relation: "confused_with" })]
    const nameToSpecies = new Map([
      ["nm_0001", "sp_001"],
      ["nm_0002", "sp_002"], // different species OK for confused_with
    ])
    const result = validateSameSpeciesConstraint(relations, nameToSpecies)
    expect(result.passed).toBe(true)
  })

  it("warns when confused_with is between same species", () => {
    const relations = [validRelation({ source_id: "nm_0001", target_id: "nm_0002", relation: "confused_with" })]
    const nameToSpecies = new Map([
      ["nm_0001", "sp_001"],
      ["nm_0002", "sp_001"], // same species is unusual for confused_with
    ])
    const result = validateSameSpeciesConstraint(relations, nameToSpecies)
    expect(result.passed).toBe(true) // still passes
    expect(result.warnings).toHaveLength(1) // but with warning
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// ORPHAN DETECTION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("validateNoOrphanedSpecies", () => {
  it("passes when all species have names", () => {
    const names = [validName({ species_id: "sp_001" })]
    const species = [validSpecies({ id: "sp_001" })]
    const result = validateNoOrphanedSpecies(names, species)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it("warns when species has no names", () => {
    const names = [validName({ species_id: "sp_001" })]
    const species = [
      validSpecies({ id: "sp_001" }),
      validSpecies({ id: "sp_002", scientific_name: "Orphanus fishus" }),
    ]
    const result = validateNoOrphanedSpecies(names, species)
    expect(result.passed).toBe(true) // passes but with warning
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain("sp_002")
  })
})

describe("validateNoOrphanedRegions", () => {
  it("passes when all regions have names", () => {
    const names = [validName({ region_id: "test-region" })]
    const regions = [validRegion({ id: "test-region" })]
    const result = validateNoOrphanedRegions(names, regions)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(0)
  })

  it("warns when region has no names", () => {
    const names = [validName({ region_id: "test-region" })]
    const regions = [
      validRegion({ id: "test-region" }),
      validRegion({ id: "empty-region", name: "Empty Region" }),
    ]
    const result = validateNoOrphanedRegions(names, regions)
    expect(result.passed).toBe(true)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain("empty-region")
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// DUPLICATE DETECTION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("validateNoDuplicateNames", () => {
  it("passes when no duplicates", () => {
    const names = [
      validName({ id: "nm_0001", name: "Fish A", species_id: "sp_001", region_id: "region-a" }),
      validName({ id: "nm_0002", name: "Fish B", species_id: "sp_001", region_id: "region-a" }),
    ]
    const result = validateNoDuplicateNames(names)
    expect(result.passed).toBe(true)
  })

  it("fails when exact duplicate exists", () => {
    const names = [
      validName({ id: "nm_0001", name: "Fish A", species_id: "sp_001", region_id: "region-a" }),
      validName({ id: "nm_0002", name: "Fish A", species_id: "sp_001", region_id: "region-a" }), // duplicate
    ]
    const result = validateNoDuplicateNames(names)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("Duplicate"))
  })

  it("allows same name for different species", () => {
    const names = [
      validName({ id: "nm_0001", name: "Fish A", species_id: "sp_001", region_id: "region-a" }),
      validName({ id: "nm_0002", name: "Fish A", species_id: "sp_002", region_id: "region-a" }), // different species
    ]
    const result = validateNoDuplicateNames(names)
    expect(result.passed).toBe(true)
  })

  it("allows same name for different regions", () => {
    const names = [
      validName({ id: "nm_0001", name: "Fish A", species_id: "sp_001", region_id: "region-a" }),
      validName({ id: "nm_0002", name: "Fish A", species_id: "sp_001", region_id: "region-b" }), // different region
    ]
    const result = validateNoDuplicateNames(names)
    expect(result.passed).toBe(true)
  })
})

describe("validateNoDuplicateRelations", () => {
  it("passes when no duplicates", () => {
    const relations = [
      validRelation({ source_id: "nm_0001", target_id: "nm_0002", relation: "alternate_of" }),
      validRelation({ source_id: "nm_0001", target_id: "nm_0003", relation: "alternate_of" }),
    ]
    const result = validateNoDuplicateRelations(relations)
    expect(result.passed).toBe(true)
  })

  it("fails when duplicate relation exists", () => {
    const relations = [
      validRelation({ source_id: "nm_0001", target_id: "nm_0002", relation: "alternate_of" }),
      validRelation({ source_id: "nm_0001", target_id: "nm_0002", relation: "alternate_of" }), // duplicate
    ]
    const result = validateNoDuplicateRelations(relations)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("Duplicate relation"))
  })

  it("allows same pair with different relation types", () => {
    const relations = [
      validRelation({ source_id: "nm_0001", target_id: "nm_0002", relation: "alternate_of" }),
      validRelation({ source_id: "nm_0001", target_id: "nm_0002", relation: "borrowed_from" }), // different type
    ]
    const result = validateNoDuplicateRelations(relations)
    expect(result.passed).toBe(true)
  })
})

describe("validateNoSelfReferences", () => {
  it("passes when no self-references", () => {
    const relations = [validRelation({ source_id: "nm_0001", target_id: "nm_0002" })]
    const result = validateNoSelfReferences(relations)
    expect(result.passed).toBe(true)
  })

  it("fails when self-reference exists", () => {
    const relations = [validRelation({ source_id: "nm_0001", target_id: "nm_0001" })] // self-reference
    const result = validateNoSelfReferences(relations)
    expect(result.passed).toBe(false)
    expect(result.errors).toContainEqual(expect.stringContaining("Self-reference"))
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("runAllValidations", () => {
  it("runs all 23 validation checks", () => {
    const ctx = createValidationContext({
      names: [validName()],
      species: [validSpecies()],
      regions: [validRegion()],
      relations: [],
    })
    const results = runAllValidations(ctx)
    expect(results).toHaveLength(23)
  })

  it("all pass for valid minimal data", () => {
    const ctx = createValidationContext({
      names: [
        validName({ id: "nm_0001", species_id: "sp_001", region_id: "test-region" }),
        validName({ id: "nm_0002", name: "Fish B", species_id: "sp_001", region_id: "test-region" }),
      ],
      species: [validSpecies({ id: "sp_001" })],
      regions: [validRegion({ id: "test-region" })],
      relations: [validRelation({ source_id: "nm_0001", target_id: "nm_0002", relation: "alternate_of" })],
    })
    const results = runAllValidations(ctx)
    const failed = results.filter((r) => !r.passed)
    expect(failed).toHaveLength(0)
  })
})

describe("createValidationContext", () => {
  it("creates lookup sets and maps correctly", () => {
    const data = {
      names: [
        validName({ id: "nm_0001", species_id: "sp_001" }),
        validName({ id: "nm_0002", species_id: "sp_002" }),
      ],
      species: [validSpecies({ id: "sp_001" }), validSpecies({ id: "sp_002" })],
      regions: [validRegion({ id: "region-a" }), validRegion({ id: "region-b" })],
      relations: [],
    }
    const ctx = createValidationContext(data)

    expect(ctx.nameIds.has("nm_0001")).toBe(true)
    expect(ctx.nameIds.has("nm_0002")).toBe(true)
    expect(ctx.speciesIds.has("sp_001")).toBe(true)
    expect(ctx.regionIds.has("region-a")).toBe(true)
    expect(ctx.nameToSpecies.get("nm_0001")).toBe("sp_001")
    expect(ctx.nameToSpecies.get("nm_0002")).toBe("sp_002")
  })
})
