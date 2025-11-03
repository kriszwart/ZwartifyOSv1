/**
 * Database Client
 * 
 * Simple database client that can work with SQLite (file-based) or PostgreSQL
 * For templates, SQLite is the default. For production, switch to PostgreSQL.
 */

import { SQLITE_SCHEMA, POSTGRES_SCHEMA } from './schema'

export type DatabaseType = 'sqlite' | 'postgres'

export interface DatabaseConfig {
  type: DatabaseType
  // SQLite config
  path?: string // Path to SQLite database file
  // PostgreSQL config
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  connectionString?: string
}

let dbClient: any = null
let dbType: DatabaseType = 'sqlite'

/**
 * Initialize database connection
 */
export async function initDatabase(config: DatabaseConfig = { type: 'sqlite' }): Promise<void> {
  dbType = config.type

  if (config.type === 'sqlite') {
    // SQLite implementation (will use better-sqlite3 or similar)
    // For now, we'll use in-memory storage
    console.log('📦 Using in-memory storage (SQLite mode)')
    // TODO: Implement SQLite with better-sqlite3
  } else if (config.type === 'postgres') {
    // PostgreSQL implementation
    console.log('📦 Using PostgreSQL')
    // TODO: Implement PostgreSQL with pg or @vercel/postgres
  }
}

/**
 * Get database type
 */
export function getDatabaseType(): DatabaseType {
  return dbType
}

/**
 * Get schema for current database type
 */
export function getSchema(): string {
  return dbType === 'sqlite' ? SQLITE_SCHEMA : POSTGRES_SCHEMA
}

