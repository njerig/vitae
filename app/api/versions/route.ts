import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { pool, ensureUserWithDefaults } from "@/lib/db"
import { IdQuerySchema, SaveVersionSchema, VersionsArraySchema } from "@/lib/schemas"
import type { VersionGroup } from "@/lib/types"

// GET /api/versions - Get all saved resume versions for the current user, grouped by resume
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { rows } = await pool.query(
    `SELECT id, user_id, resume_group_id, parent_version_id, group_name, name, snapshot, created_at 
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

  // Group versions by resume_group_id
  const groupMap = new Map<string, VersionGroup>()
  for (const version of result.data) {
    const groupId = version.resume_group_id
    if (!groupMap.has(groupId)) {
      groupMap.set(groupId, {
        resume_group_id: groupId,
        group_name: version.group_name, // use the stored group_name
        versions: [],
      })
    }
    groupMap.get(groupId)!.versions.push({
      ...version,
      created_at: typeof version.created_at === 'string' ? version.created_at : version.created_at.toISOString(),
    })
  }

  const groups = Array.from(groupMap.values())

  return NextResponse.json(groups, { status: 200 })
}

// POST /api/versions - Save a snapshot of the current resume version
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  const body = await request.json()
  const result = SaveVersionSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { group_name, name, parent_version_id } = result.data

  // Determine the resume_group_id and group_name
  let resume_group_id: string | null = null
  let resolved_group_name: string = group_name || ''

  if (parent_version_id) {
    // Look up the parent version to inherit its resume_group_id and group_name
    const { rows: parentRows } = await pool.query(
      `SELECT resume_group_id, group_name FROM versions WHERE id = $1 AND user_id = $2`,
      [parent_version_id, userId]
    )

    if (parentRows.length > 0) {
      resume_group_id = parentRows[0].resume_group_id
      resolved_group_name = parentRows[0].group_name
    }
  }

  // For new groups, require a group_name
  if (!resume_group_id && !group_name) {
    return NextResponse.json(
      { error: "Resume name is required for new resumes" },
      { status: 400 }
    )
  }

  // Check group_name uniqueness for new groups
  if (!resume_group_id) {
    const { rows: existingRows } = await pool.query(
      `SELECT DISTINCT resume_group_id FROM versions WHERE user_id = $1 AND group_name = $2`,
      [userId, resolved_group_name]
    )

    if (existingRows.length > 0) {
      return NextResponse.json(
        { error: "A resume with this name already exists. Please choose a different name." },
        { status: 409 }
      )
    }
  }

  // Get the current working state
  let { rows } = await pool.query(
    `SELECT state, updated_at FROM working_state WHERE user_id = $1`,
    [userId]
  )

  if (rows.length === 0)
    return NextResponse.json({ error: "Working state not found" }, { status: 404 })

  const state = rows[0].state;
  const updated_at = rows[0].updated_at;

  // Insert the version
  if (resume_group_id) {
    ({ rows } = await pool.query(
      `INSERT INTO versions (user_id, resume_group_id, parent_version_id, group_name, name, snapshot, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
       RETURNING id, user_id, resume_group_id, parent_version_id, group_name, name, snapshot, created_at`,
      [userId, resume_group_id, parent_version_id, resolved_group_name, name, state, updated_at]
    ))
  } else {
    ({ rows } = await pool.query(
      `INSERT INTO versions (user_id, parent_version_id, group_name, name, snapshot, created_at)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)
       RETURNING id, user_id, resume_group_id, parent_version_id, group_name, name, snapshot, created_at`,
      [userId, parent_version_id || null, resolved_group_name, name, state, updated_at]
    ))
  }

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

  const { rowCount } = await pool.query(
    `DELETE FROM versions WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )

  if (rowCount === 0) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}