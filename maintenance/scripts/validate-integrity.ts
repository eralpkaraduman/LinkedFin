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
import type { DB } from "../../src/db/types"
import { NameRelationType, isValidRelationType, requiresSameSpecies } from "../../src/db/relations"

// Validation result tracking
interface ValidationResult {
  check: string
  passed: boolean
  errors: string[]
  warnings: string[]
}

const results: ValidationResult[] = []

function check(name: string, fn: () => { errors: string[]; warnings?: string[] }) {
  const { errors, warnings = [] } = fn()
  results.push({
    check: name,
    passed: errors.length === 0,
    errors,
    warnings,
  })
}

// Initialize Kysely with better-sqlite3
const sqliteDb = new Database("fish.db", { readonly: true })
const db = new Kysely<DB>({
  dialect: new SqliteDialect({ database: sqliteDb }),
})

async function main() {
  console.log("🔍 Validating database integrity...\n")

  // Load all data
  const names = await db.selectFrom("names").selectAll().execute()
  const species = await db.selectFrom("species").selectAll().execute()
  const regions = await db.selectFrom("regions").selectAll().execute()
  const relations = await db.selectFrom("name_relations").selectAll().execute()

  // Build lookup maps for efficient validation
  const nameIds = new Set(names.map((n) => n.id))
  const speciesIds = new Set(species.map((s) => s.id))
  const regionIds = new Set(regions.map((r) => r.id))
  const nameToSpecies = new Map(names.map((n) => [n.id, n.species_id]))

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. PRIMARY KEY / ID VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  check("Names: ID format (nm_XXXX)", () => {
    const errors: string[] = []
    const idPattern = /^nm_\d{4}$/
    for (const name of names) {
      if (!idPattern.test(name.id)) {
        errors.push(`Invalid ID format: ${name.id} (expected nm_XXXX)`)
      }
    }
    return { errors }
  })

  check("Species: ID format (sp_XXX)", () => {
    const errors: string[] = []
    const idPattern = /^sp_\d{3}$/
    for (const s of species) {
      if (!idPattern.test(s.id)) {
        errors.push(`Invalid ID format: ${s.id} (expected sp_XXX)`)
      }
    }
    return { errors }
  })

  check("Regions: ID format (kebab-case)", () => {
    const errors: string[] = []
    const idPattern = /^[a-z][a-z0-9-]*$/
    for (const r of regions) {
      if (!idPattern.test(r.id)) {
        errors.push(`Invalid ID format: ${r.id} (expected lowercase kebab-case)`)
      }
    }
    return { errors }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. REQUIRED FIELD VALIDATION (NOT NULL)
  // ═══════════════════════════════════════════════════════════════════════════

  check("Names: required fields", () => {
    const errors: string[] = []
    for (const n of names) {
      if (!n.name) errors.push(`${n.id}: missing 'name'`)
      if (!n.species_id) errors.push(`${n.id}: missing 'species_id'`)
      if (!n.region_id) errors.push(`${n.id}: missing 'region_id'`)
    }
    return { errors }
  })

  check("Species: required fields", () => {
    const errors: string[] = []
    for (const s of species) {
      if (!s.scientific_name) errors.push(`${s.id}: missing 'scientific_name'`)
    }
    return { errors }
  })

  check("Regions: required fields", () => {
    const errors: string[] = []
    for (const r of regions) {
      if (!r.name) errors.push(`${r.id}: missing 'name'`)
      if (!r.language) errors.push(`${r.id}: missing 'language'`)
    }
    return { errors }
  })

  check("Relations: required fields", () => {
    const errors: string[] = []
    for (const rel of relations) {
      if (!rel.source_id) errors.push(`Relation missing 'source_id'`)
      if (!rel.target_id) errors.push(`Relation missing 'target_id'`)
      if (!rel.relation) errors.push(`Relation missing 'relation' type`)
    }
    return { errors }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. FOREIGN KEY VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  check("Names → Species foreign key", () => {
    const errors: string[] = []
    for (const n of names) {
      if (!speciesIds.has(n.species_id)) {
        errors.push(`${n.id} (${n.name}): references non-existent species '${n.species_id}'`)
      }
    }
    return { errors }
  })

  check("Names → Regions foreign key", () => {
    const errors: string[] = []
    for (const n of names) {
      if (!regionIds.has(n.region_id)) {
        errors.push(`${n.id} (${n.name}): references non-existent region '${n.region_id}'`)
      }
    }
    return { errors }
  })

  check("Regions: parent_region foreign key", () => {
    const errors: string[] = []
    for (const r of regions) {
      if (r.parent_region && !regionIds.has(r.parent_region)) {
        errors.push(`${r.id} (${r.name}): references non-existent parent region '${r.parent_region}'`)
      }
    }
    return { errors }
  })

  check("Relations: source_id foreign key", () => {
    const errors: string[] = []
    for (const rel of relations) {
      if (!nameIds.has(rel.source_id)) {
        errors.push(`Relation references non-existent source name '${rel.source_id}'`)
      }
    }
    return { errors }
  })

  check("Relations: target_id foreign key", () => {
    const errors: string[] = []
    for (const rel of relations) {
      if (!nameIds.has(rel.target_id)) {
        errors.push(`Relation references non-existent target name '${rel.target_id}'`)
      }
    }
    return { errors }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. RELATION TYPE VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════

  check("Relations: valid relation types", () => {
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
    return { errors }
  })

  check("Relations: same-species constraint", () => {
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

      // Warning for confused_with on same species (unusual but not invalid)
      if (rel.relation === "confused_with" && sourceSpecies === targetSpecies) {
        warnings.push(
          `'confused_with' relation between same species: ${rel.source_id} ↔ ${rel.target_id} (${sourceSpecies})`
        )
      }
    }
    return { errors, warnings }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ORPHAN DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  check("Species: no orphaned records", () => {
    const errors: string[] = []
    const warnings: string[] = []
    const usedSpecies = new Set(names.map((n) => n.species_id))
    for (const s of species) {
      if (!usedSpecies.has(s.id)) {
        warnings.push(`Species ${s.id} (${s.scientific_name}) has no associated names`)
      }
    }
    return { errors, warnings }
  })

  check("Regions: no orphaned records", () => {
    const errors: string[] = []
    const warnings: string[] = []
    const usedRegions = new Set(names.map((n) => n.region_id))
    for (const r of regions) {
      if (!usedRegions.has(r.id)) {
        warnings.push(`Region ${r.id} (${r.name}) has no associated names`)
      }
    }
    return { errors, warnings }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. DUPLICATE DETECTION
  // ═══════════════════════════════════════════════════════════════════════════

  check("Names: no exact duplicates (same name + species + region)", () => {
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
    return { errors }
  })

  check("Relations: no duplicate relations", () => {
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
    return { errors }
  })

  check("Relations: no self-references", () => {
    const errors: string[] = []
    for (const rel of relations) {
      if (rel.source_id === rel.target_id) {
        errors.push(`Self-reference: ${rel.source_id} → ${rel.target_id} (${rel.relation})`)
      }
    }
    return { errors }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════

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

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
