import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { ensureUserWithDefaults, pool } from "@/lib/db"
import { IdQuerySchema } from "@/lib/schemas"

/**
 * POST /api/versions/[id]/restore
 * Restores a specific version snapshot to the user's working state.
 * 
 * @param request The incoming Next.js request object.
 * @param params The dynamic route parameters containing the version `id` to restore.
 * @returns A JSON response confirming success and providing the restored version details.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  // validate params
  const { id } = await params
  const result = IdQuerySchema.safeParse({ id })
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed", issues: result.error.issues }, { status: 400 })
  }

  // Get the version snapshot
  const { rows: versionRows } = await pool.query(`SELECT id, resume_group_id, snapshot FROM versions WHERE id = $1 AND user_id = $2`, [id, userId])

  if (versionRows.length === 0) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 })
  }

  const { snapshot, resume_group_id } = versionRows[0]

  // Update the working state with the version's snapshot
  const { rowCount } = await pool.query(
    `UPDATE working_state 
     SET state = $1::jsonb, updated_at = now() 
     WHERE user_id = $2`,
    [JSON.stringify(snapshot), userId],
  )

  if (rowCount === 0) {
    return NextResponse.json({ error: "Working state not found" }, { status: 404 })
  }

  return NextResponse.json(
    {
      success: true,
      restored: snapshot,
      version_id: id,
      resume_group_id: resume_group_id,
    },
    { status: 200 },
  )
}

