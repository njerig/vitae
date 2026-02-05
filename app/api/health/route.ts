// app/api/health/route.ts
// Health check endpoint

import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ ok: true })
}
