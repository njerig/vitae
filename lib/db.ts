// lib/db.ts
// Database connection pool for Next.js API routes

import { Pool } from "pg"

// Create a singleton pool instance
const globalForPg = globalThis as unknown as { pool: Pool | undefined }

export const pool =
  globalForPg.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

// Preserve pool across hot reloads in development
if (process.env.NODE_ENV !== "production") {
  globalForPg.pool = pool
}

// Default item types created for new users
export const DEFAULT_ITEM_TYPES = [
  "Work Experience",
  "Education",
  "Project",
  "Skill",
  "Link",
]

/**
 * Ensures user row exists and creates default item_types if new.
 * Uses a transaction to ensure atomicity.
 */
export async function ensureUserWithDefaults(userId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Insert user if they do not exist yet
    await client.query(
      `INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
      [userId]
    )

    // Create default item_types if user is new
    for (const displayName of DEFAULT_ITEM_TYPES) {
      await client.query(
        `INSERT INTO item_types (user_id, display_name)
         SELECT $1, $2
         WHERE NOT EXISTS (
           SELECT 1 FROM item_types
           WHERE user_id = $1 AND display_name = $2
         )`,
        [userId, displayName]
      )
    }

    await client.query("COMMIT")
  } catch (err) {
    await client.query("ROLLBACK")
    throw err
  } finally {
    client.release()
  }
}
