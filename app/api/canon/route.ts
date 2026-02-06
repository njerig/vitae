// app/api/canon/route.ts
// Canon Items API endpoints

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { pool, ensureUserWithDefaults } from "@/lib/db"
import {
  CreateCanonItemSchema,
  PatchCanonItemSchema,
  IdQuerySchema,
  ItemTypeQuerySchema,
  getContentSchema,
} from "@/lib/schemas"

// GET /api/canon?item_type_id=<uuid> - List canon items
export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  const searchParams = request.nextUrl.searchParams
  const queryResult = ItemTypeQuerySchema.safeParse({
    item_type_id: searchParams.get("item_type_id") || undefined,
  })

  if (!queryResult.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: queryResult.error.issues },
      { status: 400 }
    )
  }

  const { item_type_id } = queryResult.data

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
    item_type_id ? [userId, item_type_id] : [userId]
  )

  return NextResponse.json(rows)
}

// POST /api/canon - Create a new canon item
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  const body = await request.json()
  const result = CreateCanonItemSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { item_type_id, title, position, content } = result.data

  // Verify item_type_id belongs to this user and get display_name
  const typeCheck = await pool.query(
    `SELECT id, display_name FROM item_types WHERE id = $1 AND user_id = $2`,
    [item_type_id, userId]
  )

  if (typeCheck.rows.length === 0) {
    return NextResponse.json({ error: "Invalid item_type_id" }, { status: 400 })
  }

  // Validate content against the appropriate schema
  const contentSchema = getContentSchema(typeCheck.rows[0].display_name)
  const contentResult = contentSchema.safeParse(content)
  if (!contentResult.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: contentResult.error.issues },
      { status: 400 }
    )
  }

  const { rows } = await pool.query(
    `INSERT INTO canon_items (user_id, item_type_id, title, position, content)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     RETURNING id, user_id, item_type_id, title, position, content, created_at, updated_at`,
    [userId, item_type_id, title, position, JSON.stringify(content)]
  )

  return NextResponse.json(rows[0], { status: 201 })
}

// PATCH /api/canon?id=<uuid> - Update a canon item
export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await ensureUserWithDefaults(userId)


  const searchParams = request.nextUrl.searchParams
  const idResult = IdQuerySchema.safeParse({ id: searchParams.get("id") })
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: idResult.error.issues },
      { status: 400 }
    )
  }

  const { id } = idResult.data

  const body = await request.json()
  const bodyResult = PatchCanonItemSchema.safeParse(body)
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: bodyResult.error.issues },
      { status: 400 }
    )
  }

  const { title, position, content } = bodyResult.data

  // If content is being updated, we need to validate it
  if (content !== undefined) {
    const existing = await pool.query(
      `SELECT ci.content, it.display_name 
       FROM canon_items ci
       JOIN item_types it ON ci.item_type_id = it.id
       WHERE ci.id = $1 AND ci.user_id = $2`,
      [id, userId]
    )

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Merge existing content with new content (new values override old)
    const mergedContent = { ...existing.rows[0].content, ...content }

    // Validate the merged content against the appropriate schema
    const contentSchema = getContentSchema(existing.rows[0].display_name)
    const contentResult = contentSchema.safeParse(mergedContent)
    if (!contentResult.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: contentResult.error.issues },
        { status: 400 }
      )
    }
  }

  // Build dynamic SET clause
  const sets: string[] = []
  const vals: (string | number)[] = [id, userId]
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

  if (sets.length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { rows } = await pool.query(
    `UPDATE canon_items
     SET ${sets.join(", ")}, updated_at = now()
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, item_type_id, title, position, content, created_at, updated_at`,
    vals
  )

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(rows[0])
}

// DELETE /api/canon?id=<uuid> - Delete a canon item
export async function DELETE(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)


  const searchParams = request.nextUrl.searchParams
  const idResult = IdQuerySchema.safeParse({ id: searchParams.get("id") })
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: idResult.error.issues },
      { status: 400 }
    )
  }

  const { id } = idResult.data

  const result = await pool.query(
    `DELETE FROM canon_items WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
