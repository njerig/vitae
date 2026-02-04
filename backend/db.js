// backend/db.js
// Database connection pool and helper functions

const { Pool } = require("pg")

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Default item types created for new users
const DEFAULT_ITEM_TYPES = [
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
async function ensureUserWithDefaults(userId) {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")

    // Insert user if they do not exist yet
    await client.query(`INSERT INTO users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [userId])

    // Create default item_types if user is new
    for (const displayName of DEFAULT_ITEM_TYPES) {
      await client.query(
        `INSERT INTO item_types (user_id, display_name)
         SELECT $1, $2
         WHERE NOT EXISTS (
           SELECT 1 FROM item_types
           WHERE user_id = $1 AND display_name = $2
         )`,
        [userId, displayName],
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

module.exports = {
  pool,
  ensureUserWithDefaults,
  DEFAULT_ITEM_TYPES,
}
