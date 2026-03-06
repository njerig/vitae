import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { ensureUserWithDefaults, pool } from "@/lib/shared/db"
import { IdQuerySchema } from "@/lib/shared/schemas"

/**
 * POST /api/versions/[id]/restore
 * Restores a specific version snapshot to the user's working state.
 *
 * This route updates the working state and also returns any
 * archived canon items that are referenced by the snapshot but no longer exist
 * in canon_items. Client uses these to supplement the preview render so
 * deleted items still appear in the historical snapshot without being restored
 * to the user's active canon list.
 *
 * @param request The incoming Next.js request object.
 * @param params The dynamic route parameters containing the version `id` to restore.
 * @returns A JSON response with: success, version_id, resume_group_id, restored (snapshot),
 *          and archived_items (canon items that were deleted but are still in the snapshot).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  // Validate the route param
  const { id } = await params
  const result = IdQuerySchema.safeParse({ id })
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    )
  }

  // Fetch the version snapshot
  const { rows: versionRows } = await pool.query(
    `SELECT id, resume_group_id, snapshot FROM versions WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )

  if (versionRows.length === 0) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 })
  }

  const { snapshot, resume_group_id } = versionRows[0]

  // Restore the snapshot into the user's working state
  const { rowCount } = await pool.query(
    `UPDATE working_state 
     SET state = $1::jsonb, updated_at = now() 
     WHERE user_id = $2`,
    [JSON.stringify(snapshot), userId]
  )

  if (rowCount === 0) {
    return NextResponse.json({ error: "Working state not found" }, { status: 404 })
  }

  // Resolve archived items referenced by the snapshot
  // The snapshot stores { sections: [{ item_ids: [uuid, ...] }] }.
  // Collect every item_id from the snapshot, then check which of those IDs
  // no longer exist in canon_items but do exist in canon_archive.
  // These archived items are returned to the client so the preview can render
  // them WITHOUT restoring them to the user's live canon list.

  const snapshotSections = (snapshot as { sections?: { item_ids?: string[] }[] }).sections ?? []
  const snapshotItemIds: string[] = snapshotSections.flatMap((s) => s.item_ids ?? [])

  let archivedItems: unknown[] = []

  if (snapshotItemIds.length > 0) {
    // Find IDs that are in the snapshot but absent from live canon_items
    const { rows: liveRows } = await pool.query(
      `SELECT id FROM canon_items WHERE id = ANY($1::uuid[]) AND user_id = $2`,
      [snapshotItemIds, userId]
    )
    const liveIds = new Set(liveRows.map((r) => r.id))
    const missingIds = snapshotItemIds.filter((id) => !liveIds.has(id))

    if (missingIds.length > 0) {
      // Fetch the matching archived rows (expire stale ones first as a courtesy)
      await pool.query(
        `DELETE FROM canon_archive WHERE user_id = $1 AND deleted_at < now() - INTERVAL '30 days'`,
        [userId]
      )

      const { rows: archiveRows } = await pool.query(
        `SELECT id, user_id, item_type_id, title, position, content, created_at, updated_at, deleted_at
           FROM canon_archive
          WHERE id = ANY($1::uuid[]) AND user_id = $2`,
        [missingIds, userId]
      )
      archivedItems = archiveRows
    }
  }

  return NextResponse.json(
    {
      success: true,
      version_id: id,
      resume_group_id,
      restored: snapshot,
      archived_items: archivedItems,
    },
    { status: 200 }
  )
}
