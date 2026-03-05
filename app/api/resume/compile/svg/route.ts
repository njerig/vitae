import { NextRequest, NextResponse } from "next/server"
import { compileResume } from "@/lib/typst/compile"

// -- Helpers ------------------------------------------------------------------

/**
 * Checks if a value is a record.
 * @param v - The value to check.
 * @returns True if the value is a record, false otherwise.
 */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null
}

/**
 * Makes a compiler error message from an unknown error.
 * @param error - The error to make a message from.
 * @returns The compiler error message.
 */
function errorMessage(error: unknown): string {
  if (isRecord(error) && typeof error.code === "string" && error.code.trim() !== "") {
    return error.code
  }
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message
  }
  return "Compilation failed"
}

// -- Main Functions -----------------------------------------------------------

/**
 * Compiles a resume to an SVG.
 * @param request - The request to compile the resume from.
 * @returns The compiled resume as an SVG file.
 * @throws A 500 error if the compilation fails.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const data = isRecord(body) ? body.data : null
    const templateId =
      isRecord(body) && typeof body.template_id === "string" ? body.template_id : "classic"

    if (!isRecord(data)) {
      return NextResponse.json({ error: "data field is required" }, { status: 400 })
    }

    const svg = await compileResume({ data, templateId, format: "svg" })

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Typst compilation error:", error)
    const message = errorMessage(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
