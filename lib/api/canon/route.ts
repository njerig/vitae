import { syncCurrentUser } from "@/lib/sync-user"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { Pool } from "pg"

// optimize pool creation

declare global {
  // eslint-disable-next-line no-var
  var __vitaePgPool: Pool | undefined
}

const pool =
  global.__vitaePgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

global.__vitaePgPool = pool

// Helpers
const ALLOWED_ITEM_TYPES = new Set(["education", "work", "project", "skill", "link"])
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

// Create a canon resume history item
export async function POST(request: NextRequest) {
  try {
    const userId = await syncCurrentUser() // ensure user exists in DB

    const body = await request.json()
    const item_type = String(body?.item_type ?? "")
    const title = typeof body?.title === "string" ? body.title : ""
    const position = typeof body?.position === "number" && Number.isFinite(body.position) ? body.position : 0
    const content = body?.content ?? {}

    if (!ALLOWED_ITEM_TYPES.has(item_type)) {
      return NextResponse.json(
        {
          error: `Invalid item_type. Must be one of: ${Array.from(ALLOWED_ITEM_TYPES).join(", ")}`,
        },
        { status: 400 },
      )
    }

    if (!isPlainObject(content)) {
      return NextResponse.json({ error: "content must be a JSON object" }, { status: 400 })
    }

    const { rows } = await pool.query(
      `
      INSERT INTO canon_items (user_id, item_type, title, position, content)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      RETURNING id, user_id, item_type, title, position, content, created_at, updated_at
      `,
      [userId, item_type, title, position, JSON.stringify(content)],
    )

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error) {
    console.error(`Error creating canon item: ${error}`)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Get all canon history items for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const userId = await syncCurrentUser()

    const { searchParams } = new URL(request.url)
    const item_type = searchParams.get("item_type") // optional filter, e.g. work

    if (item_type !== null && !ALLOWED_ITEM_TYPES.has(item_type)) {
      return NextResponse.json(
        {
          error: `Invalid item_type filter. Must be one of: ${Array.from(ALLOWED_ITEM_TYPES).join(", ")}`,
        },
        { status: 400 },
      )
    }

    const { rows } = await pool.query(
      `
          SELECT id, user_id, item_type, title, position, content, created_at, updated_at
          FROM canon_items
          WHERE user_id = $1
          ORDER BY item_type ASC, position ASC NULLS LAST, created_at ASC
          `,
      [userId],
    )

    return NextResponse.json(rows)
  } catch (error) {
    console.error(`Error fetching canon items: ${error}`)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Delete
export async function DELETE(request: NextRequest) {
  try {
    const userId = await syncCurrentUser()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing id query param" }, { status: 400 })
    }

    const r = await pool.query(
      `
      DELETE FROM canon_items
      WHERE id = $1 AND user_id = $2
      `,
      [id, userId],
    )

    if (r.rowCount === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(`Error deleting canon item: ${error}`)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

// Patch a specific canon item by id (expects ?id=<uuid> OR body.id)
// Allowed fields: title, position, content (merged into existing JSONB)
// !! Needs a look over
export async function PATCH(request: NextRequest) {
  try {
    const userId = await syncCurrentUser()

    const { searchParams } = new URL(request.url)
    const qsId = searchParams.get("id")

    const body = await request.json().catch(() => ({}))
    const id = typeof body?.id === "string" ? body.id : qsId

    if (!id) {
      return NextResponse.json({ error: "Missing id (query param ?id=... or body.id)" }, { status: 400 })
    }

    const title = body?.title
    const position = body?.position
    const content = body?.content

    if (content !== undefined && !isPlainObject(content)) {
      return NextResponse.json({ error: "content must be a JSON object" }, { status: 400 })
    }

    const sets: string[] = []
    const vals: any[] = [id, userId]
    let i = 3

    if (title !== undefined) {
      if (typeof title !== "string") return NextResponse.json({ error: "title must be a string" }, { status: 400 })
      sets.push(`title = $${i++}`)
      vals.push(title)
    }

    if (position !== undefined) {
      if (typeof position !== "number" || !Number.isFinite(position)) {
        return NextResponse.json({ error: "position must be a number" }, { status: 400 })
      }
      sets.push(`position = $${i++}`)
      vals.push(position)
    }

    if (content !== undefined) {
      sets.push(`content = content || $${i++}::jsonb`)
      vals.push(JSON.stringify(content))
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "No fields to patch" }, { status: 400 })
    }

    const { rows } = await pool.query(
      `
      UPDATE canon_items
      SET ${sets.join(", ")},
          updated_at = now()
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, item_type, title, position, content, created_at, updated_at
      `,
      vals,
    )

    if (!rows.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error(`Error patching canon item: ${error}`)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
