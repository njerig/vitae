import type { TailoringAxes, TailoringPromptParams } from "@/lib/resume-builder/tailor/options"

type SectionPayload = {
  item_type_id: string
  type_name: string
  items: { id: string; title: string; content: Record<string, unknown> }[]
}

type ComposePromptInput = {
  contextType: "job_description" | "audience"
  contextText: string
  axes: TailoringAxes
  params: TailoringPromptParams
  sections: SectionPayload[]
}

export function buildComposePrompt({
  contextType,
  contextText,
  axes,
  params,
  sections,
}: ComposePromptInput): string {
  const contextInterpretation =
    contextType === "job_description"
      ? "Treat TAILORING CONTEXT as a target job description. Prioritize items that directly match role requirements, keywords, and outcomes in that description."
      : "Treat TAILORING CONTEXT as a target audience/role direction. Prioritize items that best support that direction, including transferable evidence even when titles do not exactly match."

  const sectionDescriptions = sections
    .map((section) => {
      const itemList = section.items
        .map(
          (item) =>
            `  - ID: "${item.id}" | Title: "${item.title}" | Details: ${JSON.stringify(item.content)}`
        )
        .join("\n")
      return `Section: "${section.type_name}" (type_id: "${section.item_type_id}")\n${itemList}`
    })
    .join("\n\n")

  return `You are a resume tailoring assistant.

You must perform TWO tasks together:
1) Prioritize resume sections/items for relevance.
2) Propose concise override edits for relevant items.

TAILORING CONTEXT TYPE: ${contextType}
TAILORING CONTEXT:
${contextText}

CONTEXT INTERPRETATION:
- ${contextInterpretation}

TAILORING AXES (0 to 1):
- industry: ${axes.industry}
- tone: ${axes.tone}
- technicalDepth: ${axes.technicalDepth}
- length: ${axes.length}

MAPPED DIRECTIVES:
- ${params.directives.join("\n- ")}

CURRENT RESUME ITEMS:
${sectionDescriptions}

Respond ONLY with valid JSON in this exact format:
{
  "sections": [
    {
      "item_type_id": "<section type_id>",
      "item_ids": ["<item_id_1>", "<item_id_2>"]
    }
  ],
  "overrides": [
    {
      "item_id": "<item_id>",
      "title": "<optional revised title>",
      "content": { "<field>": "<value>" }
    }
  ]
}

Rules:
- Only include item IDs that were in input.
- Prioritization must be driven primarily by TAILORING CONTEXT TYPE and TAILORING CONTEXT.
- For audience mode, match on responsibilities and evidence, not just exact title keywords.
- If audience text implies teaching/education/training/mentorship, boost items with tutoring, mentoring, instruction, curriculum, facilitation, coaching, or knowledge-transfer evidence.
- Keep edits fact-preserving; do not invent companies/projects/timeline.
- Preserve the original tense when rewriting any bullet text.
- Keep override content concise and realistic.
- You may omit overrides for items that do not need wording changes.
- Do not return markdown or explanation.`
}
