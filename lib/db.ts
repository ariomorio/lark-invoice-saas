/**
 * Turso Database Client Configuration
 * 
 * This module initializes and exports the Turso (libSQL) database client.
 * It supports both local development and edge deployment (Vercel).
 */

import { createClient } from '@libsql/client';

// Validate required environment variables
if (!process.env.TURSO_DATABASE_URL) {
  throw new Error('TURSO_DATABASE_URL environment variable is required');
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error('TURSO_AUTH_TOKEN environment variable is required');
}

/**
 * Turso database client instance
 * 
 * This client is configured to work with Turso's edge-compatible SQLite database.
 * It uses the libSQL protocol for optimal performance in serverless environments.
 */
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

/**
 * Execute a query and return the results
 * 
 * @param sql - SQL query string
 * @param params - Query parameters (optional)
 * @returns Query results
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const result = await db.execute({
    sql,
    args: params || [],
  });
  
  return result.rows as T[];
}

/**
 * Execute a single query and return the first result
 * 
 * @param sql - SQL query string
 * @param params - Query parameters (optional)
 * @returns First result or null
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const results = await query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Execute a mutation query (INSERT, UPDATE, DELETE)
 * 
 * @param sql - SQL query string
 * @param params - Query parameters (optional)
 * @returns Number of affected rows
 */
export async function execute(
  sql: string,
  params?: any[]
): Promise<number> {
  const result = await db.execute({
    sql,
    args: params || [],
  });
  
  return result.rowsAffected;
}

/**
 * Execute multiple queries in a transaction
 * 
 * @param queries - Array of SQL queries with parameters
 * @returns Transaction results
 */
export async function transaction(
  queries: Array<{ sql: string; params?: any[] }>
): Promise<void> {
  const batch = queries.map(({ sql, params }) => ({
    sql,
    args: params || [],
  }));
  
  await db.batch(batch);
}

export default db;
