/**
 * Data Integrity Validation Script
 *
 * Validates the fish.db database against the Kysely schema:
 * - Foreign key relationships
 * - Required fields (NOT NULL constraints)
 * - Relation type enum values
 * - Orphaned records
 * - ID format consistency
 *
 * Run: pnpm db:validate
 * Exit codes: 0 = pass, 1 = fail
 */

import Database from "better-sqlite3"
import { Kysely, SqliteDialect } from "kysely"
import type { DB, Names, Species, Regions, NameRelations } from "../../src/db/types"
import { NameRelationType, isValidRelationType, requiresSameSpecies } from "../../src/db/relations"

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface ValidationResult {
  check: string
  passed: boolean
  errors: string[]
  warnings: string[]
}

export interface ValidationData {
  names: Names[]
  species: Species[]
  regions: Regions[]
  relations: NameRelations[]
}

export interface ValidationContext extends ValidationData {
  nameIds: Set<string>
  speciesIds: Set<string>
  regionIds: Set<string>
  nameToSpecies: Map<string, string>
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS (exported for testing)
// ═══════════════════════════════════════════════════════════════════════════

export function validateNameIdFormat(names: Names[]): ValidationResult {
  const errors: string[] = []
  const idPattern = /^nm_\d{4}$/
  for (const name of names) {
    if (!idPattern.test(name.id)) {
      errors.push(`Invalid ID format: ${name.id} (expected nm_XXXX)`)
    }
  }
  return { check: "Names: ID format (nm_XXXX)", passed: errors.length === 0, errors, warnings: [] }
}

export function validateSpeciesIdFormat(species: Species[]): ValidationResult {
  const errors: string[] = []
  const idPattern = /^sp_\d{3}$/
  for (const s of species) {
    if (!idPattern.test(s.id)) {
      errors.push(`Invalid ID format: ${s.id} (expected sp_XXX)`)
    }
  }
  return { check: "Species: ID format (sp_XXX)", passed: errors.length === 0, errors, warnings: [] }
}

export function validateRegionIdFormat(regions: Regions[]): ValidationResult {
  const errors: string[] = []
  const idPattern = /^[a-z][a-z0-9-]*$/
  for (const r of regions) {
    if (!idPattern.test(r.id)) {
      errors.push(`Invalid ID format: ${r.id} (expected lowercase kebab-case)`)
    }
  }
  return { check: "Regions: ID format (kebab-case)", passed: errors.length === 0, errors, warnings: [] }
}

export function validateNamesRequiredFields(names: Names[]): ValidationResult {
  const errors: string[] = []
  for (const n of names) {
    if (!n.name) errors.push(`${n.id}: missing 'name'`)
    if (!n.species_id) errors.push(`${n.id}: missing 'species_id'`)
    if (!n.region_id) errors.push(`${n.id}: missing 'region_id'`)
  }
  return { check: "Names: required fields", passed: errors.length === 0, errors, warnings: [] }
}

export function validateSpeciesRequiredFields(species: Species[]): ValidationResult {
  const errors: string[] = []
  for (const s of species) {
    if (!s.scientific_name) errors.push(`${s.id}: missing 'scientific_name'`)
  }
  return { check: "Species: required fields", passed: errors.length === 0, errors, warnings: [] }
}

export function validateRegionsRequiredFields(regions: Regions[]): ValidationResult {
  const errors: string[] = []
  for (const r of regions) {
    if (!r.name) errors.push(`${r.id}: missing 'name'`)
    if (!r.language) errors.push(`${r.id}: missing 'language'`)
  }
  return { check: "Regions: required fields", passed: errors.length === 0, errors, warnings: [] }
}

export function validateRelationsRequiredFields(relations: NameRelations[]): ValidationResult {
  const errors: string[] = []
  for (const rel of relations) {
    if (!rel.source_id) errors.push(`Relation missing 'source_id'`)
    if (!rel.target_id) errors.push(`Relation missing 'target_id'`)
    if (!rel.relation) errors.push(`Relation missing 'relation' type`)
  }
  return { check: "Relations: required fields", passed: errors.length === 0, errors, warnings: [] }
}

export function validateNamesToSpeciesFK(names: Names[], speciesIds: Set<string>): ValidationResult {
  const errors: string[] = []
  for (const n of names) {
    if (!speciesIds.has(n.species_id)) {
      errors.push(`${n.id} (${n.name}): references non-existent species '${n.species_id}'`)
    }
  }
  return { check: "Names → Species foreign key", passed: errors.length === 0, errors, warnings: [] }
}

export function validateNamesToRegionsFK(names: Names[], regionIds: Set<string>): ValidationResult {
  const errors: string[] = []
  for (const n of names) {
    if (!regionIds.has(n.region_id)) {
      errors.push(`${n.id} (${n.name}): references non-existent region '${n.region_id}'`)
    }
  }
  return { check: "Names → Regions foreign key", passed: errors.length === 0, errors, warnings: [] }
}

export function validateRegionsParentFK(regions: Regions[], regionIds: Set<string>): ValidationResult {
  const errors: string[] = []
  for (const r of regions) {
    if (r.parent_region && !regionIds.has(r.parent_region)) {
      errors.push(`${r.id} (${r.name}): references non-existent parent region '${r.parent_region}'`)
    }
  }
  return { check: "Regions: parent_region foreign key", passed: errors.length === 0, errors, warnings: [] }
}

export function validateRelationsSourceFK(relations: NameRelations[], nameIds: Set<string>): ValidationResult {
  const errors: string[] = []
  for (const rel of relations) {
    if (!nameIds.has(rel.source_id)) {
      errors.push(`Relation references non-existent source name '${rel.source_id}'`)
    }
  }
  return { check: "Relations: source_id foreign key", passed: errors.length === 0, errors, warnings: [] }
}

export function validateRelationsTargetFK(relations: NameRelations[], nameIds: Set<string>): ValidationResult {
  const errors: string[] = []
  for (const rel of relations) {
    if (!nameIds.has(rel.target_id)) {
      errors.push(`Relation references non-existent target name '${rel.target_id}'`)
    }
  }
  return { check: "Relations: target_id foreign key", passed: errors.length === 0, errors, warnings: [] }
}

export function validateRelationTypes(relations: NameRelations[]): ValidationResult {
  const errors: string[] = []
  const validTypes = Object.values(NameRelationType)
  for (const rel of relations) {
    if (!isValidRelationType(rel.relation)) {
      errors.push(
        `Invalid relation type '${rel.relation}' (${rel.source_id} → ${rel.target_id}). ` +
        `Valid types: ${validTypes.join(", ")}`
      )
    }
  }
  return { check: "Relations: valid relation types", passed: errors.length === 0, errors, warnings: [] }
}

export function validateSameSpeciesConstraint(
  relations: NameRelations[],
  nameToSpecies: Map<string, string>
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  for (const rel of relations) {
    if (!isValidRelationType(rel.relation)) continue

    const sourceSpecies = nameToSpecies.get(rel.source_id)
    const targetSpecies = nameToSpecies.get(rel.target_id)

    if (!sourceSpecies || !targetSpecies) continue

    if (requiresSameSpecies(rel.relation) && sourceSpecies !== targetSpecies) {
      errors.push(
        `Relation '${rel.relation}' requires same species, but ${rel.source_id} (${sourceSpecies}) → ` +
        `${rel.target_id} (${targetSpecies}) are different species`
      )
    }

    if (rel.relation === "confused_with" && sourceSpecies === targetSpecies) {
      warnings.push(
        `'confused_with' relation between same species: ${rel.source_id} ↔ ${rel.target_id} (${sourceSpecies})`
      )
    }
  }
  return { check: "Relations: same-species constraint", passed: errors.length === 0, errors, warnings }
}

export function validateNoOrphanedSpecies(names: Names[], species: Species[]): ValidationResult {
  const warnings: string[] = []
  const usedSpecies = new Set(names.map((n) => n.species_id))
  for (const s of species) {
    if (!usedSpecies.has(s.id)) {
      warnings.push(`Species ${s.id} (${s.scientific_name}) has no associated names`)
    }
  }
  return { check: "Species: no orphaned records", passed: true, errors: [], warnings }
}

export function validateNoOrphanedRegions(names: Names[], regions: Regions[]): ValidationResult {
  const warnings: string[] = []
  const usedRegions = new Set(names.map((n) => n.region_id))
  for (const r of regions) {
    if (!usedRegions.has(r.id)) {
      warnings.push(`Region ${r.id} (${r.name}) has no associated names`)
    }
  }
  return { check: "Regions: no orphaned records", passed: true, errors: [], warnings }
}

export function validateNoDuplicateNames(names: Names[]): ValidationResult {
  const errors: string[] = []
  const seen = new Map<string, string>()
  for (const n of names) {
    const key = `${n.name}|${n.species_id}|${n.region_id}`
    if (seen.has(key)) {
      errors.push(`Duplicate: ${n.id} and ${seen.get(key)} both have name='${n.name}' for same species/region`)
    } else {
      seen.set(key, n.id)
    }
  }
  return { check: "Names: no exact duplicates (same name + species + region)", passed: errors.length === 0, errors, warnings: [] }
}

export function validateNoDuplicateRelations(relations: NameRelations[]): ValidationResult {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const rel of relations) {
    const key = `${rel.source_id}|${rel.target_id}|${rel.relation}`
    if (seen.has(key)) {
      errors.push(`Duplicate relation: ${rel.source_id} → ${rel.target_id} (${rel.relation})`)
    } else {
      seen.add(key)
    }
  }
  return { check: "Relations: no duplicate relations", passed: errors.length === 0, errors, warnings: [] }
}

export function validateNoSelfReferences(relations: NameRelations[]): ValidationResult {
  const errors: string[] = []
  for (const rel of relations) {
    if (rel.source_id === rel.target_id) {
      errors.push(`Self-reference: ${rel.source_id} → ${rel.target_id} (${rel.relation})`)
    }
  }
  return { check: "Relations: no self-references", passed: errors.length === 0, errors, warnings: [] }
}

export function validateLangFormat(names: Names[]): ValidationResult {
  const errors: string[] = []
  const iso639_3Pattern = /^[a-z]{3}$/
  for (const n of names) {
    if (!n.lang) {
      errors.push(`${n.id} (${n.name}): missing 'lang'`)
    } else if (!iso639_3Pattern.test(n.lang)) {
      errors.push(`${n.id} (${n.name}): invalid lang '${n.lang}' (expected 3-letter ISO 639-3 code)`)
    }
  }
  return { check: "Names: lang format (ISO 639-3)", passed: errors.length === 0, errors, warnings: [] }
}

export function validateTransliteration(names: Names[]): ValidationResult {
  const errors: string[] = []
  for (const n of names) {
    if (n.transliteration === null) {
      errors.push(`${n.id} (${n.name}): missing transliteration`)
    } else if (n.transliteration === "") {
      errors.push(`${n.id} (${n.name}): transliteration is empty string`)
    }
  }
  return { check: "Names: transliteration required", passed: errors.length === 0, errors, warnings: [] }
}

export function validatePhonetic(names: Names[]): ValidationResult {
  const errors: string[] = []
  // IPA must be enclosed in slashes /.../ (phonemic) or brackets [...] (phonetic)
  const ipaPattern = /^(\/[^\/]+\/|\[[^\]]+\])$/
  // Valid IPA: basic Latin, IPA extensions (U+0250-02AF), spacing modifiers (U+02B0-02FF),
  // combining diacritics (U+0300-036F), plus common punctuation
  const validIpaChars = /^[\[\]\/a-z\u00C0-\u03FF\u1D00-\u1DBF \-'.,()]+$/
  for (const n of names) {
    if (n.phonetic === null) {
      errors.push(`${n.id} (${n.name}): missing phonetic`)
    } else if (n.phonetic === "") {
      errors.push(`${n.id} (${n.name}): phonetic is empty string`)
    } else if (!ipaPattern.test(n.phonetic)) {
      errors.push(`${n.id} (${n.name}): phonetic '${n.phonetic}' must be enclosed in /slashes/ or [brackets]`)
    } else if (!validIpaChars.test(n.phonetic)) {
      errors.push(`${n.id} (${n.name}): phonetic '${n.phonetic}' contains invalid IPA characters`)
    }
  }
  return { check: "Names: phonetic format (IPA)", passed: errors.length === 0, errors, warnings: [] }
}

export function validateEtymology(names: Names[]): ValidationResult {
  const errors: string[] = []
  for (const n of names) {
    if (n.etymology === null) {
      errors.push(`${n.id} (${n.name}): missing etymology`)
    } else if (n.etymology === "") {
      errors.push(`${n.id} (${n.name}): etymology is empty string`)
    }
  }
  return { check: "Names: etymology required", passed: errors.length === 0, errors, warnings: [] }
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN ALL VALIDATIONS
// ═══════════════════════════════════════════════════════════════════════════

export function runAllValidations(ctx: ValidationContext): ValidationResult[] {
  return [
    validateNameIdFormat(ctx.names),
    validateSpeciesIdFormat(ctx.species),
    validateRegionIdFormat(ctx.regions),
    validateNamesRequiredFields(ctx.names),
    validateSpeciesRequiredFields(ctx.species),
    validateRegionsRequiredFields(ctx.regions),
    validateRelationsRequiredFields(ctx.relations),
    validateLangFormat(ctx.names),
    validateTransliteration(ctx.names),
    validatePhonetic(ctx.names),
    validateEtymology(ctx.names),
    validateNamesToSpeciesFK(ctx.names, ctx.speciesIds),
    validateNamesToRegionsFK(ctx.names, ctx.regionIds),
    validateRegionsParentFK(ctx.regions, ctx.regionIds),
    validateRelationsSourceFK(ctx.relations, ctx.nameIds),
    validateRelationsTargetFK(ctx.relations, ctx.nameIds),
    validateRelationTypes(ctx.relations),
    validateSameSpeciesConstraint(ctx.relations, ctx.nameToSpecies),
    validateNoOrphanedSpecies(ctx.names, ctx.species),
    validateNoOrphanedRegions(ctx.names, ctx.regions),
    validateNoDuplicateNames(ctx.names),
    validateNoDuplicateRelations(ctx.relations),
    validateNoSelfReferences(ctx.relations),
  ]
}

export function createValidationContext(data: ValidationData): ValidationContext {
  return {
    ...data,
    nameIds: new Set(data.names.map((n) => n.id)),
    speciesIds: new Set(data.species.map((s) => s.id)),
    regionIds: new Set(data.regions.map((r) => r.id)),
    nameToSpecies: new Map(data.names.map((n) => [n.id, n.species_id])),
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN (CLI entry point)
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  console.log("🔍 Validating database integrity...\n")

  // Initialize Kysely with better-sqlite3
  const sqliteDb = new Database("fish.db", { readonly: true })
  const db = new Kysely<DB>({
    dialect: new SqliteDialect({ database: sqliteDb }),
  })

  // Load all data
  const names = await db.selectFrom("names").selectAll().execute()
  const species = await db.selectFrom("species").selectAll().execute()
  const regions = await db.selectFrom("regions").selectAll().execute()
  const relations = await db.selectFrom("name_relations").selectAll().execute()

  const ctx = createValidationContext({ names, species, regions, relations })
  const results = runAllValidations(ctx)

  // Print results
  console.log("═".repeat(70))
  console.log("VALIDATION RESULTS")
  console.log("═".repeat(70))

  let totalErrors = 0
  let totalWarnings = 0

  for (const result of results) {
    const status = result.passed ? "✅" : "❌"
    const errorCount = result.errors.length
    const warningCount = result.warnings.length

    let suffix = ""
    if (errorCount > 0) suffix += ` (${errorCount} error${errorCount > 1 ? "s" : ""})`
    if (warningCount > 0) suffix += ` (${warningCount} warning${warningCount > 1 ? "s" : ""})`

    console.log(`${status} ${result.check}${suffix}`)

    for (const error of result.errors.slice(0, 5)) {
      console.log(`   ❌ ${error}`)
    }
    if (result.errors.length > 5) {
      console.log(`   ... and ${result.errors.length - 5} more errors`)
    }

    for (const warning of result.warnings.slice(0, 3)) {
      console.log(`   ⚠️  ${warning}`)
    }
    if (result.warnings.length > 3) {
      console.log(`   ... and ${result.warnings.length - 3} more warnings`)
    }

    totalErrors += errorCount
    totalWarnings += warningCount
  }

  console.log("\n" + "═".repeat(70))
  console.log("SUMMARY")
  console.log("═".repeat(70))
  console.log(`Records: ${names.length} names, ${species.length} species, ${regions.length} regions, ${relations.length} relations`)
  console.log(`Checks:  ${results.length} total, ${results.filter((r) => r.passed).length} passed, ${results.filter((r) => !r.passed).length} failed`)
  console.log(`Issues:  ${totalErrors} errors, ${totalWarnings} warnings`)

  // Cleanup
  await db.destroy()
  sqliteDb.close()

  // Exit with appropriate code
  if (totalErrors > 0) {
    console.log("\n❌ Validation FAILED")
    process.exit(1)
  } else if (totalWarnings > 0) {
    console.log("\n⚠️  Validation PASSED with warnings")
    process.exit(0)
  } else {
    console.log("\n✅ Validation PASSED")
    process.exit(0)
  }
}

// Only run main if this is the entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("Fatal error:", err)
    process.exit(1)
  })
}
