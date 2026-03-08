/**
 * Client-side API wrapper for the resume tailoring feature.
 * Sends job description and current resume sections to the prioritize endpoint.
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

type TailorPrioritizationResponse = {
  sections: {
    item_type_id: string
    item_ids: string[]
  }[]
}

/**
 * Sends the job description and current resume sections to the tailor API
 * for AI-powered prioritization.
 * @param jobDescription - The pasted job description text
 * @param sections - Current resume sections with item details
 * @returns Prioritized sections matching WorkingState.sections shape
 */
export async function tailorPrioritize(
  jobDescription: string,
  sections: SectionPayload[]
): Promise<TailorPrioritizationResponse> {
  const res = await fetch("/api/tailor/prioritize", {
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
