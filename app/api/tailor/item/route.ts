// app/api/tailor/item/route.ts
// AI-powered per-item resume tailoring — rewrites a single canon item's bullets
// to better match a specific job description

import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "")

type RequestBody = {
    job_description: string
    item: {
        id: string
        title: string
        type_name: string
        content: Record<string, unknown>
    }
}

/**
 * POST /api/tailor/item
 * Accepts a job description and a single resume item,
 * asks Gemini to rewrite the item's bullets/description to better match the role,
 * and returns the suggested content alongside the original.
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
    const { job_description, item } = body

    if (!job_description || !item) {
        return NextResponse.json(
            { error: "job_description and item are required" },
            { status: 400 }
        )
    }

    const prompt = `You are a professional resume writer. Your task is to rewrite the bullet points of a single resume item to better match a specific job description.

ITEM TYPE: ${item.type_name}
ITEM TITLE: ${item.title}
CURRENT CONTENT:
${JSON.stringify(item.content, null, 2)}

JOB DESCRIPTION:
${job_description}

Rewrite ONLY the "bullets" field (and optionally "skills" if present) to better highlight relevant experience for this job. Keep the same role, company, dates and other fields exactly as they are. Make bullet points more specific, quantified, and relevant to the job description. Keep the same number of bullets or fewer — do not add new ones.

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "bullets": ["rewritten bullet 1", "rewritten bullet 2"],
  "skills": ["skill1", "skill2"]
}

If the item has no bullets field, return:
{
  "bullets": [],
  "skills": []
}`

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" })
        const result = await model.generateContent(prompt)
        const text = result.response.text()

        const cleaned = text
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "")
            .trim()

        const parsed = JSON.parse(cleaned)

        if (!Array.isArray(parsed.bullets)) {
            return NextResponse.json({ error: "Invalid AI response format" }, { status: 502 })
        }

        return NextResponse.json({
            suggestion: {
                bullets: parsed.bullets,
                skills: Array.isArray(parsed.skills) ? parsed.skills : [],
            },
        })
    } catch (error) {
        console.error("Tailor item error:", error)
        return NextResponse.json({ error: "AI processing failed" }, { status: 502 })
    }
}