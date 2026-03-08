type SectionPayload = {
  item_type_id: string
  type_name: string
  items: { id: string; title: string; content: Record<string, unknown> }[]
}

type SelectionPromptInput = {
  jobDescription: string
  sections: SectionPayload[]
}

export function buildSelectionPrompt({ jobDescription, sections }: SelectionPromptInput): string {
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

  return `You are a professional resume optimization assistant. Given a job description and a list of resume sections with their items, your task is to:

1. Reorder the sections so the most relevant ones appear first for this job.
2. Within each section, reorder items so the most relevant appear first.
3. Remove items that are NOT relevant to the job description. Be selective - a targeted resume is better than a comprehensive one.
4. Keep the section type_ids and item IDs exactly as provided.

JOB DESCRIPTION:
${jobDescription}

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
}
