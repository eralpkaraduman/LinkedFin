/**
 * Kysely database type definitions
 * Re-exports the generated types for use with Kysely
 */

// Re-export all generated types
export type {
  DB,
  Names,
  Species,
  Regions,
  NameRelations,
  Generated,
} from "./types"

// Type alias for the database interface (Kysely convention)
export type { DB as Database } from "./types"
