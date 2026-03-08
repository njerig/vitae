import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { GeminiConfigurationError, geminiConfigured, generateGeminiText } from "@/lib/ai/gemini"
import { mapTailoringAxesToPromptParams, TailoringAxesSchema } from "@/lib/tailor/options"
import { buildRewritePrompt } from "@/lib/tailor/prompts/buildRewritePrompt"

const TailorOptionsRequestSchema = z.object({
  base_text: z.string().trim().min(1, "base_text is required"),
  job_description: z.string().optional().default(""),
  axes: TailoringAxesSchema,
})

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!geminiConfigured()) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
  }

  let parsedBody: z.infer<typeof TailorOptionsRequestSchema>
  try {
    const body = await request.json()
    parsedBody = TailorOptionsRequestSchema.parse(body)
  } catch {
    return NextResponse.json(
      { error: "base_text, axes(industry/tone/technicalDepth/length) are required" },
      { status: 400 }
    )
  }

  const params = mapTailoringAxesToPromptParams(parsedBody.axes)
  const prompt = buildRewritePrompt({
    baseText: parsedBody.base_text,
    jobDescription: parsedBody.job_description,
    axes: parsedBody.axes,
    params,
  })

  try {
    const tailoredText = await generateGeminiText(prompt, { model: "gemini-2.5-flash-lite" })
    return NextResponse.json({
      text: tailoredText,
      axes: parsedBody.axes,
      params,
    })
  } catch (error) {
    if (error instanceof GeminiConfigurationError) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 })
    }

    console.error("Tailor options error:", error)
    return NextResponse.json({ error: "AI processing failed" }, { status: 502 })
  }
}
