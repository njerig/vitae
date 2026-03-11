import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { GeminiConfigurationError, generateGeminiJson, geminiConfigured } from "@/lib/ai/gemini"
import { mapTailoringAxesToPromptParams, TailoringAxesSchema } from "@/lib/tailor/options"
import { buildComposePrompt } from "@/lib/tailor/prompts/buildComposePrompt"

const TailorComposeRequestSchema = z.object({
  context_type: z.enum(["job_description", "audience"]),
  context_text: z.string().trim().min(1, "context_text is required"),
  axes: TailoringAxesSchema,
  sections: z.array(
    z.object({
      item_type_id: z.string().min(1),
      type_name: z.string().min(1),
      items: z.array(
        z.object({
          id: z.string().min(1),
          title: z.string(),
          content: z.record(z.string(), z.unknown()),
        })
      ),
    })
  ),
})

type ComposeResponse = {
  sections: { item_type_id: string; item_ids: string[] }[]
  overrides?: { item_id: string; title?: string; content?: Record<string, unknown> }[]
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!geminiConfigured()) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
  }

  let parsedBody: z.infer<typeof TailorComposeRequestSchema>
  try {
    const body = await request.json()
    parsedBody = TailorComposeRequestSchema.parse(body)
  } catch {
    return NextResponse.json(
      { error: "context_type, context_text, axes, and sections are required" },
      { status: 400 }
    )
  }

  const params = mapTailoringAxesToPromptParams(parsedBody.axes)
  const prompt = buildComposePrompt({
    contextType: parsedBody.context_type,
    contextText: parsedBody.context_text,
    axes: parsedBody.axes,
    params,
    sections: parsedBody.sections,
  })

  try {
    const parsed = await generateGeminiJson<ComposeResponse>(prompt, {
      model: "gemini-2.5-flash-lite",
    })

    if (!parsed.sections || !Array.isArray(parsed.sections)) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 })
    }

    const validIds = new Set(parsedBody.sections.flatMap((s) => s.items.map((i) => i.id)))

    const sanitizedSections = parsed.sections
      .map((s) => ({
        item_type_id: s.item_type_id,
        item_ids: (s.item_ids || []).filter((id) => validIds.has(id)),
      }))
      .filter((s) => s.item_ids.length > 0)

    const sanitizedOverrides = (parsed.overrides || [])
      .filter((o) => validIds.has(o.item_id))
      .map((o) => ({
        item_id: o.item_id,
        ...(typeof o.title === "string" ? { title: o.title } : {}),
        ...(o.content && typeof o.content === "object" ? { content: o.content } : {}),
      }))
      .filter((o) => Boolean(o.title) || Boolean(o.content))

    return NextResponse.json({
      sections: sanitizedSections,
      overrides: sanitizedOverrides,
      axes: parsedBody.axes,
      context_type: parsedBody.context_type,
      context_text: parsedBody.context_text,
    })
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 })
    }

    console.error("Tailor compose error:", error)
    return NextResponse.json({ error: "AI processing failed" }, { status: 502 })
  }
}
