/**
 * Custom Kysely dialect adapter for @sqlite.org/sqlite-wasm
 */

import type { IGenericSqlite } from "kysely-generic-sqlite"
import { GenericSqliteDialect, parseBigInt } from "kysely-generic-sqlite"
import sqlite3InitModule, { type Database } from "@sqlite.org/sqlite-wasm"

export type SqliteWasmDatabase = Database

/**
 * Create a SQLite executor compatible with kysely-generic-sqlite
 */
export function createSqliteWasmExecutor(
  db: Database
): IGenericSqlite<Database> {
  return {
    db,
    query: (_isSelect, sql, parameters) => {
      // Cast to the expected types for @sqlite.org/sqlite-wasm
      const result = db.exec({
        sql,
        bind: parameters as (string | number | null | Uint8Array)[],
        returnValue: "resultRows" as const,
        rowMode: "object" as const,
      })

      // For SELECT queries, return rows
      // For other queries, we can't easily get changes/lastInsertRowid from this API
      return {
        rows: result as unknown as Record<string, unknown>[],
        numAffectedRows: parseBigInt(0),
        insertId: parseBigInt(0),
      }
    },
    close: () => db.close(),
  }
}

/**
 * Initialize SQLite WASM and load database from a URL
 */
export async function initSqliteWasm(
  dbUrl: string,
  onProgress?: (message: string) => void
): Promise<Database> {
  const report = onProgress || (() => {})

  report("Loading SQLite WASM...")
  const sqlite3 = await sqlite3InitModule()

  report("Fetching database...")
  const response = await fetch(dbUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch database: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)

  report("Initializing database...")
  const p = sqlite3.wasm.allocFromTypedArray(bytes)
  const db = new sqlite3.oo1.DB()
  const dbPtr = db.pointer
  if (!dbPtr) {
    throw new Error("Failed to initialize database: null pointer")
  }
  sqlite3.capi.sqlite3_deserialize(
    dbPtr,
    "main",
    p,
    bytes.length,
    bytes.length,
    sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE |
      sqlite3.capi.SQLITE_DESERIALIZE_READONLY
  )

  return db
}

/**
 * Create a Kysely dialect for SQLite WASM
 */
export function createSqliteWasmDialect(db: Database): GenericSqliteDialect {
  return new GenericSqliteDialect(() => createSqliteWasmExecutor(db))
}
