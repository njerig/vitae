// backend/index.js
// Express API with Zod v4 validation

const express = require("express")
const cors = require("cors")
require("dotenv").config()

const { clerkMiddleware } = require("@clerk/express")
const { pool, ensureUserWithDefaults } = require("./db")
const {
  requireAuth,
  validateBody,
  validateQuery,
  asyncHandler,
  errorHandler,
} = require("./middleware")
const {
  CreateItemTypeSchema,
  CreateCanonItemSchema,
  PatchCanonItemSchema,
  IdQuerySchema,
  ItemTypeQuerySchema,
  getContentSchema,
} = require("./schemas")

const app = express()

// ─────────────────────────────────────────────────────────────
// Global Middleware Configurations
// ─────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: process.env.WEB_ORIGIN,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  })
)

app.use(express.json())
app.use(clerkMiddleware())

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ ok: true })
})

// ─────────────────────────────────────────────────────────────
// Item Types Routes
// ─────────────────────────────────────────────────────────────

// GET /api/item-types - List all item types for the user
app.get(
  "/api/item-types",
  requireAuth,
  asyncHandler(async (req, res) => {
    await ensureUserWithDefaults(req.userId)

    const { rows } = await pool.query(
      `SELECT id, user_id, display_name, created_at
       FROM item_types
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [req.userId]
    )

    res.json(rows)
  })
)

// POST /api/item-types - Create a new item type
app.post(
  "/api/item-types",
  requireAuth,
  validateBody(CreateItemTypeSchema),
  asyncHandler(async (req, res) => {
    await ensureUserWithDefaults(req.userId)

    const { display_name } = req.validatedBody

    const { rows } = await pool.query(
      `INSERT INTO item_types (user_id, display_name)
       VALUES ($1, $2)
       RETURNING id, user_id, display_name, created_at`,
      [req.userId, display_name]
    )

    res.status(201).json(rows[0])
  })
)

// ─────────────────────────────────────────────────────────────
// Canon Items Routes
// ─────────────────────────────────────────────────────────────

// GET /api/canon?item_type_id=<uuid> - List canon items
app.get(
  "/api/canon",
  requireAuth,
  validateQuery(ItemTypeQuerySchema),
  asyncHandler(async (req, res) => {
    await ensureUserWithDefaults(req.userId)

    const { item_type_id } = req.validatedQuery

    // retrieve either all canon items or just a specific type of them
    const { rows } = await pool.query(
      item_type_id
        ? `SELECT id, user_id, item_type_id, title, position, content, created_at, updated_at
            FROM canon_items
            WHERE user_id = $1 AND item_type_id = $2
            ORDER BY position ASC NULLS LAST, created_at ASC`
        : `SELECT id, user_id, item_type_id, title, position, content, created_at, updated_at
            FROM canon_items
            WHERE user_id = $1
            ORDER BY item_type_id ASC, position ASC NULLS LAST, created_at ASC`,
      item_type_id ? [req.userId, item_type_id] : [req.userId],
    )

    res.json(rows)
  }),
)

// POST /api/canon - Create a new canon item
app.post(
  "/api/canon",
  requireAuth,
  validateBody(CreateCanonItemSchema),
  asyncHandler(async (req, res) => {
    await ensureUserWithDefaults(req.userId)

    const { item_type_id, title, position, content } = req.validatedBody

    // Verify item_type_id belongs to this user and get display_name
    const typeCheck = await pool.query(`SELECT id, display_name FROM item_types WHERE id = $1 AND user_id = $2`, [item_type_id, req.userId])

    // if, somehow, they requested an item type that does not exist yet in their table
    if (typeCheck.rows.length === 0) {
      return res.status(400).json({ error: "Invalid item_type_id" })
    }

    // Validate content against the appropriate schema
    const contentSchema = getContentSchema(typeCheck.rows[0].display_name)
    const contentResult = contentSchema.safeParse(content)
    if (!contentResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        issues: contentResult.error.issues,
      })
    }

    const { rows } = await pool.query(
      `INSERT INTO canon_items (user_id, item_type_id, title, position, content)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING id, user_id, item_type_id, title, position, content, created_at, updated_at`,
      [req.userId, item_type_id, title, position, JSON.stringify(content)],
    )

    res.status(201).json(rows[0])
  }),
)

// PATCH /api/canon?id=<uuid> - Update a canon item
app.patch( "/api/canon", requireAuth, validateQuery(IdQuerySchema), validateBody(PatchCanonItemSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.validatedQuery
    const { title, position, content } = req.validatedBody

    // Build dynamic SET clause so we can update only what is needed
    const sets = []
    const vals = [id, req.userId]
    let paramIndex = 3

    if (title !== undefined) {
      sets.push(`title = $${paramIndex++}`)
      vals.push(title)
    }

    if (position !== undefined) {
      sets.push(`position = $${paramIndex++}`)
      vals.push(position)
    }

    if (content !== undefined) {
      sets.push(`content = content || $${paramIndex++}::jsonb`)
      vals.push(JSON.stringify(content))
    }

    const { rows } = await pool.query(
      `UPDATE canon_items
       SET ${sets.join(", ")}, updated_at = now()
       WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, item_type_id, title, position, content, created_at, updated_at`,
      vals,
    )

    if (rows.length === 0) {
      return res.status(404).json({ error: "Not found" })
    }

    res.json(rows[0])
  })
)

// DELETE /api/canon?id=<uuid> - Delete a canon item
app.delete("/api/canon", requireAuth, validateQuery(IdQuerySchema), asyncHandler(async (req, res) => {
    const { id } = req.validatedQuery

    const result = await pool.query(
      `DELETE FROM canon_items
       WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    )

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Not found" })
    }

    res.status(204).send() // "No Content", so .send() ends the api call/connection
  })
)

// Error Handler middleware
app.use(errorHandler)

// Start Server
const port = Number(process.env.PORT)
app.listen(port, () =>
  console.log(`Express API listening on http://localhost:${port}`)
)
