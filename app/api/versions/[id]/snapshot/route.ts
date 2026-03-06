import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/shared/db"
import { IdQuerySchema } from "@/lib/shared/schemas"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const result = IdQuerySchema.safeParse({ id })
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: result.error.issues },
      { status: 400 }
    )
  }

  const { rows } = await pool.query(
    `SELECT snapshot FROM versions WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )

  if (rows.length === 0) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 })
  }

  return NextResponse.json(rows[0].snapshot, { status: 200 })
}
