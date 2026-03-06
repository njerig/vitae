import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { pool, ensureUserWithDefaults } from "@/lib/shared/db"
import { IdQuerySchema, ArchiveItemsArraySchema } from "@/lib/shared/schemas"

// How long (in days) before an archived item is permanently deleted.
const ARCHIVE_TTL_DAYS = 30

/**
 * Prunes expired archive rows for the given user.
 * Called at the start of every archive request (lazy expiry).
 * This avoids the need for an external cron job.
 */
async function pruneExpiredArchiveItems(userId: string): Promise<void> {
  await pool.query(
    `DELETE FROM canon_archive
      WHERE user_id = $1
        AND deleted_at < now() - INTERVAL '${ARCHIVE_TTL_DAYS} days'`,
    [userId]
  )
}

/**
 * GET /api/archive
 * Returns all archived (soft-deleted) canon items for the authenticated user
 * that have not yet expired (i.e. deleted within the last 30 days).
 *
 * Expired items are pruned on every request (lazy expiry).
 *
 * @returns A JSON array of ArchivedCanonItem objects, ordered newest-deleted first.
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  // Prune expired rows before returning results
  await pruneExpiredArchiveItems(userId)

  const { rows } = await pool.query(
    `SELECT id, user_id, item_type_id, title, position, content,
            created_at, updated_at, deleted_at
       FROM canon_archive
      WHERE user_id = $1
      ORDER BY deleted_at DESC`,
    [userId]
  )

  // Validate the response shape through Zod
  const parseResult = ArchiveItemsArraySchema.safeParse(rows)
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Data validation failed", issues: parseResult.error.issues },
      { status: 500 }
    )
  }

  return NextResponse.json(parseResult.data)
}

/**
 * POST /api/archive?id=<uuid>
 * Restores an archived item back into the user's live canon_items table.
 *
 * The item is moved out of canon_archive and re-inserted into canon_items
 * with its original UUID, content, and timestamps preserved.
 *
 * @param request The incoming request containing the item's `id` as a search param.
 * @returns A JSON response containing the restored CanonItem.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  // Validate query param
  const searchParams = request.nextUrl.searchParams
  const idResult = IdQuerySchema.safeParse({ id: searchParams.get("id") })
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: idResult.error.issues },
      { status: 400 }
    )
  }

  const { id } = idResult.data

  // Prune expired rows (good hygiene; prevents restoring a conceptually-expired item
  // if the client somehow still shows it after TTL)
  await pruneExpiredArchiveItems(userId)

  // Move the item back from archive into live canon_items.
  // We use INSERT ... SELECT so the operation is atomic — the item is never in both tables.
  const { rows } = await pool.query(
    `WITH moved AS (
       DELETE FROM canon_archive
        WHERE id = $1 AND user_id = $2
       RETURNING id, user_id, item_type_id, title, position, content, created_at, updated_at
     )
     INSERT INTO canon_items (id, user_id, item_type_id, title, position, content, created_at, updated_at)
       SELECT id, user_id, item_type_id, title, position, content, created_at, now()
         FROM moved
     RETURNING id, user_id, item_type_id, title, position, content, created_at, updated_at`,
    [id, userId]
  )

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Archived item not found or already expired" },
      { status: 404 }
    )
  }

  return NextResponse.json(rows[0], { status: 200 })
}

/**
 * DELETE /api/archive?id=<uuid>
 * Permanently deletes an archived item (bypasses the TTL — no recovery).
 *
 * @param request The incoming request containing the item's `id` as a search param.
 * @returns A 204 No Content response on success.
 */
export async function DELETE(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureUserWithDefaults(userId)

  // Validate query param
  const searchParams = request.nextUrl.searchParams
  const idResult = IdQuerySchema.safeParse({ id: searchParams.get("id") })
  if (!idResult.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: idResult.error.issues },
      { status: 400 }
    )
  }

  const { id } = idResult.data

  const { rowCount } = await pool.query(
    `DELETE FROM canon_archive WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )

  if (rowCount === 0) {
    return NextResponse.json({ error: "Archived item not found" }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
