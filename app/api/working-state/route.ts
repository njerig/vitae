// app/api/working-state/route.ts
// Working State API endpoints

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { pool, ensureUserWithDefaults } from "@/lib/db"
import { WorkingStateSchema } from "@/lib/schemas"

// GET /api/working-state - Get user's current working state
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  const { rows } = await pool.query(
    `SELECT state, updated_at FROM working_state WHERE user_id = $1`,
    [userId]
  )

  // Return empty state if none exists yet
  if (rows.length === 0) {
    return NextResponse.json({ state: { sections: [] }, updated_at: null })
  }

  return NextResponse.json({ state: rows[0].state, updated_at: rows[0].updated_at })
}

// PUT /api/working-state - Update user's working state
export async function PUT(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  const body = await request.json()
  const result = WorkingStateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    )
  }

  const state = result.data

  // Validate that all item_type_ids belong to this user
  const itemTypeIds = state.sections.map((s) => s.item_type_id)
  if (itemTypeIds.length > 0) {
    const { rows: validTypes } = await pool.query(
      `SELECT id FROM item_types WHERE user_id = $1 AND id = ANY($2::uuid[])`,
      [userId, itemTypeIds]
    )
    if (validTypes.length !== itemTypeIds.length) {
      return NextResponse.json(
        { error: "Invalid item_type_id(s) - not found or not owned by user" },
        { status: 400 }
      )
    }
  }

  // Validate that all item_ids belong to this user
  const allItemIds = state.sections.flatMap((s) => s.item_ids)
  if (allItemIds.length > 0) {
    const { rows: validItems } = await pool.query(
      `SELECT id FROM canon_items WHERE user_id = $1 AND id = ANY($2::uuid[])`,
      [userId, allItemIds]
    )
    if (validItems.length !== allItemIds.length) {
      return NextResponse.json(
        { error: "Invalid item_id(s) - not found or not owned by user" },
        { status: 400 }
      )
    }
  }

  // Upsert the working state
  const { rows } = await pool.query(
    `INSERT INTO working_state (user_id, state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (user_id)
     DO UPDATE SET state = $2::jsonb, updated_at = now()
     RETURNING state, updated_at`,
    [userId, JSON.stringify(state)]
  )

  return NextResponse.json({ state: rows[0].state, updated_at: rows[0].updated_at })
}
