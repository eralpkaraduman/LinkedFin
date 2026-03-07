/**
 * Kysely database type definitions
 * Re-exports the generated types for use with Kysely
 */

// Re-export all generated types
// Type alias for the database interface (Kysely convention)
export type {
	DB,
	DB as Database,
	Generated,
	NameRelations,
	Names,
	Regions,
	Species,
} from "./types";
