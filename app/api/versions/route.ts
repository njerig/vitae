import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { pool, ensureUserWithDefaults } from "@/lib/db"
import { IdQuerySchema, ResumeNameSchema, VersionsArraySchema } from "@/lib/schemas"

// GET /api/versions - Get all saved resume versions for the current user
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { rows } = await pool.query(
    `SELECT id, user_id, name, snapshot, created_at 
     FROM versions 
     WHERE user_id = $1 
     ORDER BY created_at DESC`,
    [userId]
  )

  const result = VersionsArraySchema.safeParse(rows)
  if (!result.success) {
    return NextResponse.json(
      { error: "Data validation failed", issues: result.error.issues },
      { status: 500 }
    )
  }

  console.log(JSON.stringify(result.data))

  return NextResponse.json(result.data, { status: 200 })
}

// POST /api/versions - Save a snapshot fo the current resume version
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  const body = await request.json()
  const result = ResumeNameSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { name } = result.data

  // Check if name already exists for this user
  const { rows: existingRows } = await pool.query(
    `SELECT id FROM versions WHERE user_id = $1 AND name = $2`,
    [userId, name]
  )

  if (existingRows.length > 0) {
    return NextResponse.json(
      { error: "A resume version with this name already exists. Please choose a different name." },
      { status: 409 } // 409 Conflict
    )
  }

  // get the current working state (so we can save it as a version)
  let { rows } = await pool.query(
    `SELECT state, updated_at FROM working_state WHERE user_id = $1`,
    [userId]
  )

  if (rows.length === 0)
    return NextResponse.json({ error: "Working state not found" }, { status: 404 })

  const state = rows[0].state;
  const updated_at = rows[0].updated_at;

  // insert the working list as a new array
  ({ rows } = await pool.query(
    `INSERT INTO versions (user_id, name, snapshot, created_at)
     VALUES ($1, $2, $3::jsonb, $4)
     RETURNING id, user_id, snapshot, created_at`,
    [userId, name, state, updated_at]
  ))
  console.log(JSON.stringify(rows))


  return NextResponse.json(rows[0], { status: 201 })
}

// DELETE /api/versions?id=<uuid> - Delete a specific version
export async function DELETE(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const result = IdQuerySchema.safeParse({ id: searchParams.get("id") })
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { id } = result.data

  // Delete only if it belongs to the current user
  const { rowCount } = await pool.query(
    `DELETE FROM versions WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )

  if (rowCount === 0) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}