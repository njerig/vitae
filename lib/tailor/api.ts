/**
 * Client-side API wrapper for the resume tailoring feature.
 * Sends job description and current resume sections to the selection endpoint.
 */

type SectionPayload = {
  item_type_id: string
  type_name: string
  items: {
    id: string
    title: string
    content: Record<string, unknown>
  }[]
}

type TailorSelectionResponse = {
  sections: {
    item_type_id: string
    item_ids: string[]
  }[]
}

/**
 * Sends the job description and current resume sections to the tailor API
 * for AI-powered selection/prioritization.
 * @param jobDescription - The pasted job description text
 * @param sections - Current resume sections with item details
 * @returns Selected/prioritized sections matching WorkingState.sections shape
 */
export async function tailorSelection(
  jobDescription: string,
  sections: SectionPayload[]
): Promise<TailorSelectionResponse> {
  const res = await fetch("/api/tailor/selection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_description: jobDescription, sections }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(typeof err.error === "string" ? err.error : "Tailoring failed")
  }

  return res.json()
}
