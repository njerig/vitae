// app/api/item-types/route.ts
// Item Types API endpoints

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { pool, ensureUserWithDefaults } from "@/lib/shared/db"
import { CreateItemTypeSchema } from "@/lib/shared/schemas"

/**
 * GET /api/item-types
 * Retrieves a list of all item types for the authenticated user.
 *
 * @returns A JSON response containing an array of item types or an error message.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  const { rows } = await pool.query(
    `SELECT id, user_id, display_name, created_at
     FROM item_types
     WHERE user_id = $1
     ORDER BY created_at ASC`,
    [userId]
  )

  return NextResponse.json(rows)
}

/**
 * POST /api/item-types
 * Creates a new item type for the authenticated user.
 *
 * @param request The incoming request containing the new item type data.
 * @returns A JSON response containing the newly created item type or an error message.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  const body = await request.json()
  const result = CreateItemTypeSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { display_name } = result.data

  const { rows } = await pool.query(
    `INSERT INTO item_types (user_id, display_name)
     VALUES ($1, $2)
     RETURNING id, user_id, display_name, created_at`,
    [userId, display_name]
  )

  return NextResponse.json(rows[0], { status: 201 })
}
