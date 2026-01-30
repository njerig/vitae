// backend/index.js
const express = require("express")
const cors = require("cors")
require("dotenv").config()

const { Pool } = require("pg")
const { clerkMiddleware, getAuth } = require("@clerk/express")

const app = express()

const POOL = new Pool({
  connectionString: process.env.DATABASE_URL,
})

app.use(
  cors({
    origin: process.env.WEB_ORIGIN,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
)

app.use(express.json())
app.use(clerkMiddleware())

app.get("/api/health", (_req, res) => {
  const userId = requireUserId(_req, res)
  res.json({ ok: true })
})

const ALLOWED_ITEM_TYPES = new Set(["education", "work", "project", "skill", "link"])

function isPlainObject(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

function requireUserId(req, res) {
  const { userId } = getAuth(req)
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" })
    return 
  }
  return userId
}

async function ensureUserRow(userId) {
  await POOL.query(
    `
    INSERT INTO users (id, email, full_name)
    VALUES ($1, NULL, NULL)
    ON CONFLICT (id) DO NOTHING
    `,
    [userId],
  )
}

// GET /api/canon?item_type=work
app.get("/api/canon", async (req, res) => {
  try {
    const userId = requireUserId(req, res)

    await ensureUserRow(userId)

    const item_type = req.query.item_type ?? null

    if (item_type !== null && !ALLOWED_ITEM_TYPES.has(String(item_type))) {
      return res.status(400).json({
        error: `Invalid item_type filter. Must be one of: ${Array.from(ALLOWED_ITEM_TYPES).join(", ")}`,
      })
    }

    const { rows } = await POOL.query(
      item_type
        ? `
          SELECT id, user_id, item_type, title, position, content, created_at, updated_at
          FROM canon_items
          WHERE user_id = $1 AND item_type = $2
          ORDER BY position ASC NULLS LAST, created_at ASC
          `
        : `
          SELECT id, user_id, item_type, title, position, content, created_at, updated_at
          FROM canon_items
          WHERE user_id = $1
          ORDER BY item_type ASC, position ASC NULLS LAST, created_at ASC
          `,
      item_type ? [userId, String(item_type)] : [userId],
    )

    res.json(rows)
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

// POST /api/canon
app.post("/api/canon", async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return

    await ensureUserRow(userId)

    const body = req.body ?? {}
    const item_type = String(body.item_type ?? "")
    const title = typeof body.title === "string" ? body.title : ""
    const position = typeof body.position === "number" && Number.isFinite(body.position) ? body.position : 0
    const content = body.content ?? {}

    if (!ALLOWED_ITEM_TYPES.has(item_type)) {
      return res.status(400).json({
        error: `Invalid item_type. Must be one of: ${Array.from(ALLOWED_ITEM_TYPES).join(", ")}`,
      })
    }

    if (!isPlainObject(content)) {
      return res.status(400).json({ error: "content must be a JSON object" })
    }

    const { rows } = await POOL.query(
      `
      INSERT INTO canon_items (user_id, item_type, title, position, content)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING id, user_id, item_type, title, position, content, created_at, updated_at
      `,
      [userId, item_type, title, position, JSON.stringify(content)],
    )

    res.status(201).json(rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

// PATCH /api/canon?id=<uuid>
app.patch("/api/canon", async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return

    const id = req.query.id ? String(req.query.id) : null
    if (!id) return res.status(400).json({ error: "Missing id query param" })

    const body = req.body ?? {}
    const title = body.title
    const position = body.position
    const content = body.content

    if (content !== undefined && !isPlainObject(content)) {
      return res.status(400).json({ error: "content must be a JSON object" })
    }

    const sets = []
    const vals = [id, userId]
    let i = 3

    if (title !== undefined) {
      if (typeof title !== "string") return res.status(400).json({ error: "title must be a string" })
      sets.push(`title = $${i++}`)
      vals.push(title)
    }

    if (position !== undefined) {
      if (typeof position !== "number" || !Number.isFinite(position)) {
        return res.status(400).json({ error: "position must be a number" })
      }
      sets.push(`position = $${i++}`)
      vals.push(position)
    }

    if (content !== undefined) {
      sets.push(`content = content || $${i++}::jsonb`)
      vals.push(JSON.stringify(content))
    }

    if (!sets.length) return res.status(400).json({ error: "No fields to patch" })

    const { rows } = await POOL.query(
      `
      UPDATE canon_items
      SET ${sets.join(", ")},
          updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, item_type, title, position, content, created_at, updated_at
      `,
      vals,
    )

    if (!rows.length) return res.status(404).json({ error: "Not found" })
    res.json(rows[0])
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

// DELETE /api/canon?id=<uuid>
app.delete("/api/canon", async (req, res) => {
  try {
    const userId = requireUserId(req, res)
    if (!userId) return

    const id = req.query.id ? String(req.query.id) : null
    if (!id) return res.status(400).json({ error: "Missing id query param" })

    const r = await POOL.query(
      `
      DELETE FROM canon_items
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    )

    if (!r.rowCount) return res.status(404).json({ error: "Not found" })
    res.status(204).send()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: "Server error" })
  }
})

const port = Number(process.env.PORT)
app.listen(port, () => console.log(`Express API listening on http://localhost:${port}`))
