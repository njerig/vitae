/**
 * Client-side API wrapper for the resume tailoring feature.
 * Sends job description and current resume sections to the prioritize endpoint.
 */

import type { TailoringAxes } from "./options"

export type SectionPayload = {
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

export type TailorComposePayload = {
  context_type: "job_description" | "audience"
  context_text: string
  axes: TailoringAxes
  sections: SectionPayload[]
}

export type TailorComposeResponse = {
  sections: {
    item_type_id: string
    item_ids: string[]
  }[]
  overrides: {
    item_id: string
    title?: string
    content?: Record<string, unknown>
  }[]
  axes: TailoringAxes
  context_type: "job_description" | "audience"
  context_text: string
}

export type TailorTweakItemPayload = {
  context_type: "job_description" | "audience"
  context_text: string
  axes: TailoringAxes
  items: {
    id: string
    type_name: string
    title: string
    content: Record<string, unknown>
  }[]
}

export type TailorTweakItemResponse = {
  overrides: {
    item_id: string
    content?: {
      bullets?: string[]
    }
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

export async function tailorCompose(
  payload: TailorComposePayload,
  signal?: AbortSignal
): Promise<TailorComposeResponse> {
  const res = await fetch("/api/tailor/compose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(typeof err.error === "string" ? err.error : "Tailoring compose failed")
  }

  return res.json()
}

export async function tailorTweakItem(
  payload: TailorTweakItemPayload,
  signal?: AbortSignal
): Promise<TailorTweakItemResponse> {
  const res = await fetch("/api/tailor/tweak-item", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    signal,
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(typeof err.error === "string" ? err.error : "Tailoring tweak-item failed")
  }

  return res.json()
}
