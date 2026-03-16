export type SectionState = {
  item_type_id: string
  item_ids: string[]
}

export type OverrideData = {
  title?: string
  content?: Record<string, unknown>
}

export type WorkingState = {
  sections: SectionState[]
  overrides?: Record<string, OverrideData>
  template_id?: string
  tailoring_context?: {
    context_type: "job_description" | "audience"
    context_text: string
    context_text_by_type?: {
      job_description?: string
      audience?: string
    }
    axes?: {
      industry: number
      tone: number
      technicalDepth: number
      length: number
    }
  }
}

export type WorkingStateResponse = {
  state: WorkingState
  updated_at: string | null
}

/**
 * Retrieves the user's current working state (active resume layout and overrides).
 *
 * @returns A WorkingStateResponse containing the state and its last updated timestamp.
 */
export async function getWorkingState(): Promise<WorkingStateResponse> {
  const res = await fetch("/api/working-state")
  if (!res.ok) {
    throw new Error("Failed to fetch working state")
  }
  return res.json()
}

/**
 * Updates the user's current working state (saving active resume layout and overrides).
 *
 * @param state The entire new working state to save.
 * @returns The updated WorkingStateResponse from the server.
 */
export async function updateWorkingState(state: WorkingState): Promise<WorkingStateResponse> {
  const res = await fetch("/api/working-state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  })
  if (!res.ok) {
    throw new Error("Failed to save working state")
  }
  return res.json()
}
