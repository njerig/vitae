// app/api/tailor/rerank/route.ts
// AI-powered resume tailoring endpoint — reranks canon items for a job description

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "")

type SectionPayload = {
  item_type_id: string
  type_name: string
  items: { id: string; title: string; content: Record<string, unknown> }[]
}

type RequestBody = {
  job_description: string
  sections: SectionPayload[]
}

/**
 * POST /api/tailor/rerank
 * Accepts a job description and the user's current resume sections,
 * asks Gemini to rerank/filter items for relevance, and returns
 * the optimized section ordering.
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!process.env.GEMINI_API_KEY) {
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

  // Build the prompt with all current resume items
  const sectionDescriptions = sections
    .map((section) => {
      const itemList = section.items
        .map((item) => `  - ID: "${item.id}" | Title: "${item.title}" | Details: ${JSON.stringify(item.content)}`)
        .join("\n")
      return `Section: "${section.type_name}" (type_id: "${section.item_type_id}")\n${itemList}`
    })
    .join("\n\n")

  const prompt = `You are a professional resume optimization assistant. Given a job description and a list of resume sections with their items, your task is to:

1. Reorder the sections so the most relevant ones appear first for this job.
2. Within each section, reorder items so the most relevant appear first.
3. Remove items that are NOT relevant to the job description. Be selective — a targeted resume is better than a comprehensive one.
4. Keep the section type_ids and item IDs exactly as provided.

JOB DESCRIPTION:
${job_description}

CURRENT RESUME ITEMS:
${sectionDescriptions}

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "sections": [
    {
      "item_type_id": "<section type_id>",
      "item_ids": ["<item_id_1>", "<item_id_2>"]
    }
  ]
}

Rules:
- Only include sections that have at least one relevant item.
- Only include item IDs that were provided in the input.
- Order sections and items by relevance to the job description.
- Omit items that are not relevant.`

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse the JSON response — strip markdown fences if present
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim() // use zod cleaning here
    const parsed = JSON.parse(cleaned)

    // Validate structure
    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 })
    }

    // Collect all valid item IDs from input for validation
    const validIds = new Set(sections.flatMap((s) => s.items.map((i) => i.id)))

    // Filter out any hallucinated IDs
    const sanitizedSections = parsed.sections
      .map((s: { item_type_id: string; item_ids: string[] }) => ({
        item_type_id: s.item_type_id,
        item_ids: (s.item_ids || []).filter((id: string) => validIds.has(id)),
      }))
      .filter((s: { item_ids: string[] }) => s.item_ids.length > 0)

    return NextResponse.json({ sections: sanitizedSections })
  } catch (error) {
    console.error("Tailor rerank error:", error)
    return NextResponse.json({ error: "AI processing failed" }, { status: 502 })
  }
}
