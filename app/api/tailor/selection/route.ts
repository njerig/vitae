// app/api/tailor/selection/route.ts
// AI-powered resume tailoring endpoint — selects and orders canon items for a job description

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { GeminiConfigurationError, generateGeminiJson, geminiConfigured } from "@/lib/ai/gemini"
import { buildSelectionPrompt } from "@/lib/tailor/prompts/buildSelectionPrompt"

type SectionPayload = {
  item_type_id: string
  type_name: string
  items: { id: string; title: string; content: Record<string, unknown> }[]
}

type RequestBody = {
  job_description: string
  sections: SectionPayload[]
}

type SelectionResponse = {
  sections: {
    item_type_id: string
    item_ids: string[]
  }[]
}

/**
 * POST /api/tailor/selection
 * Accepts a job description and the user's current resume sections,
 * asks Gemini to prioritize relevant sections/items, and returns
 * the optimized section selection/order.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!geminiConfigured()) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
  }

  const body: RequestBody = await request.json()
  const { job_description, sections } = body

  if (!job_description || !sections?.length) {
    return NextResponse.json(
      { error: "job_description and sections are required" },
      { status: 400 }
    )
  }

  const prompt = buildSelectionPrompt({
    jobDescription: job_description,
    sections,
  })

  try {
    const parsed = await generateGeminiJson<SelectionResponse>(prompt, {
      model: "gemini-2.5-flash-lite",
    })

    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 })
    }

    const validIds = new Set(sections.flatMap((s) => s.items.map((i) => i.id)))

    const sanitizedSections = parsed.sections
      .map((s: { item_type_id: string; item_ids: string[] }) => ({
        item_type_id: s.item_type_id,
        item_ids: (s.item_ids || []).filter((id: string) => validIds.has(id)),
      }))
      .filter((s: { item_ids: string[] }) => s.item_ids.length > 0)

    return NextResponse.json({ sections: sanitizedSections })
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 })
    }

    console.error("Tailor selection error:", error)
    return NextResponse.json({ error: "AI processing failed" }, { status: 502 })
  }
}
