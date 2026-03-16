import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  GeminiConfigurationError,
  generateGeminiJson,
  geminiConfigured,
} from "@/lib/resume-builder/tailor/ai/gemini"
import {
  mapTailoringAxesToPromptParams,
  TailoringAxesSchema,
} from "@/lib/resume-builder/tailor/options"
import { buildItemTweaksPrompt } from "@/lib/resume-builder/tailor/prompts/buildItemTweaksPrompt"

const TailorTweakItemRequestSchema = z.object({
  context_type: z.enum(["job_description", "audience"]),
  context_text: z.string().trim().min(1),
  axes: TailoringAxesSchema,
  items: z.array(
    z.object({
      id: z.string().min(1),
      type_name: z.string().min(1),
      title: z.string(),
      content: z.record(z.string(), z.unknown()),
    })
  ),
})

type TweakItemResponse = {
  overrides: {
    item_id: string
    content?: {
      bullets?: string[]
    }
  }[]
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!geminiConfigured()) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
  }

  let parsedBody: z.infer<typeof TailorTweakItemRequestSchema>
  try {
    const body = await request.json()
    parsedBody = TailorTweakItemRequestSchema.parse(body)
  } catch {
    return NextResponse.json(
      { error: "context_type, context_text, axes, and items are required" },
      { status: 400 }
    )
  }

  const params = mapTailoringAxesToPromptParams(parsedBody.axes)
  const prompt = buildItemTweaksPrompt({
    contextType: parsedBody.context_type,
    contextText: parsedBody.context_text,
    axes: parsedBody.axes,
    params,
    items: parsedBody.items,
  })

  try {
    const parsed = await generateGeminiJson<TweakItemResponse>(prompt, {
      model: "gemini-2.5-flash-lite",
    })

    const validIds = new Set(parsedBody.items.map((item) => item.id))

    const overrides = (parsed.overrides || [])
      .filter((o) => validIds.has(o.item_id))
      .map((o) => {
        const bullets = Array.isArray(o.content?.bullets)
          ? o.content?.bullets
              .filter((b): b is string => typeof b === "string")
              .map((b) => b.trim())
          : []

        return {
          item_id: o.item_id,
          ...(bullets.length > 0 ? { content: { bullets } } : {}),
        }
      })
      .filter((o) => Boolean(o.content))

    return NextResponse.json({ overrides })
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 })
    }

    console.error("Tailor tweak-item error:", error)
    return NextResponse.json({ error: "AI processing failed" }, { status: 502 })
  }
}
