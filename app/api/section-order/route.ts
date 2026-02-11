// app/api/section-order/route.ts
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { pool, ensureUserWithDefaults } from "@/lib/db"

// GET /api/section-order - Get user's saved section order
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  const { rows } = await pool.query(
    `SELECT section_order FROM user_preferences WHERE user_id = $1`,
    [userId]
  )

  return NextResponse.json({
    sectionOrder: rows[0]?.section_order || []
  })
}

// PATCH /api/section-order - Update user's section order
export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  const body = await request.json()
  const { sectionOrder } = body

  if (!Array.isArray(sectionOrder)) {
    return NextResponse.json(
      { error: "sectionOrder must be an array" },
      { status: 400 }
    )
  }

  // Upsert (insert or update)
  const { rows } = await pool.query(
    `INSERT INTO user_preferences (user_id, section_order, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET section_order = $2::jsonb, updated_at = NOW()
     RETURNING user_id, section_order, updated_at`,
    [userId, JSON.stringify(sectionOrder)]
  )

  return NextResponse.json(rows[0])
}