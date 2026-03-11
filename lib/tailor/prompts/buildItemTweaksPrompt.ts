import type { TailoringAxes, TailoringPromptParams } from "@/lib/tailor/options"

type ItemPayload = {
  id: string
  type_name: string
  title: string
  content: Record<string, unknown>
}

type BuildItemTweaksPromptInput = {
  contextType: "job_description" | "audience"
  contextText: string
  axes: TailoringAxes
  params: TailoringPromptParams
  items: ItemPayload[]
}

export function buildItemTweaksPrompt({
  contextType,
  contextText,
  axes,
  params,
  items,
}: BuildItemTweaksPromptInput): string {
  const contextModeDirective =
    contextType === "job_description"
      ? "Treat CONTEXT as a target job description. Prioritize phrasing and emphasis that align with this role's requirements and language."
      : "Treat CONTEXT as a target audience/role direction. Reframe bullets for that audience while preserving the same underlying facts."

  const itemText = items
    .map((item) => {
      const bullets = Array.isArray(item.content.bullets) ? item.content.bullets : []
      return `Item ID: "${item.id}"
Type: "${item.type_name}"
Title: "${item.title}"
Current bullets: ${JSON.stringify(bullets)}`
    })
    .join("\n\n")

  return `You are a resume tailoring assistant.

Task: Rewrite ONLY the bullet points for each provided resume item.

CONTEXT TYPE: ${contextType}
CONTEXT:
${contextText}

CONTEXT INTERPRETATION:
- ${contextModeDirective}

AXES:
- industry: ${axes.industry}
- tone: ${axes.tone}
- technicalDepth: ${axes.technicalDepth}
- length: ${axes.length}

MAPPED DIRECTIVES:
- ${params.directives.join("\n- ")}

ITEMS:
${itemText}

Return ONLY valid JSON:
{
  "overrides": [
    {
      "item_id": "<item id>",
      "content": {
        "bullets": ["bullet 1", "bullet 2"]
      }
    }
  ]
}

Rules:
- Only include item IDs provided above.
- Only modify bullets (no title, dates, org, role, etc.).
- Keep facts truthful; do not invent achievements.
- Preserve concrete facts exactly unless they are already present in another bullet of the same item:
  - keep numbers, percentages, dollar amounts, dates, team sizes, and durations unchanged
  - keep named tools, systems, methods, and compliance frameworks unchanged
  - keep domain claims at the same seniority/scope (do not inflate ownership)
- Preserve the original tense of each bullet (do not switch past/present/future tense).
- Keep bullets concise and impact-focused.
- If an item has no bullets or does not need changes, you may omit it.`
}
