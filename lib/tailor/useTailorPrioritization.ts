"use client"

import { useCallback, useState } from "react"
import toast from "react-hot-toast"
import { tailorPrioritize } from "@/lib/tailor/api"
import type { CanonItem } from "@/lib/shared/types"

// -- Types --------------------------------------------------------------------

type TailoringContextType = "job_description" | "audience"

type TailoringAxes = {
  industry: number
  tone: number
  technicalDepth: number
  length: number
}

type Section = {
  typeName: string
  typeId: string
  items: CanonItem[]
}

type PrioritizedSectionIds = {
  item_type_id: string
  item_ids: string[]
}

type WorkingState = {
  sections: PrioritizedSectionIds[]
  overrides?: Record<string, { title?: string; content?: Record<string, unknown> }>
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

type TailorPrioritizationPayload = {
  contextType: TailoringContextType
  contextText: string
  axes: TailoringAxes
}

// -- Helpers ------------------------------------------------------------------

/**
 * Builds prioritize endpoint payload sections from local UI sections.
 *
 * @param sections - UI sections with item objects.
 * @returns API payload sections containing IDs and serializable content.
 */
function buildSectionPayloads(sections: Section[]) {
  return sections.map((section) => ({
    item_type_id: section.typeId,
    type_name: section.typeName,
    items: section.items.map((item) => ({
      id: item.id,
      title: item.title,
      content: item.content as Record<string, unknown>,
    })),
  }))
}

/**
 * Maps prioritized API response back onto display sections and working-state section IDs.
 *
 * @param currentSections - Current UI sections before prioritization.
 * @param prioritizedSections - Prioritized IDs returned by API.
 * @returns Display section order and section ID state payload.
 */
function mapPrioritizedSections(
  currentSections: Section[],
  prioritizedSections: PrioritizedSectionIds[]
): { displaySections: Section[]; aiSectionIds: PrioritizedSectionIds[] } {
  const aiSectionIds: PrioritizedSectionIds[] = []
  const displaySections = prioritizedSections
    .map((rankedSection) => {
      const original = currentSections.find(
        (section) => section.typeId === rankedSection.item_type_id
      )
      if (!original) return null

      const selectedSet = new Set(rankedSection.item_ids)
      const reorderedItems = [
        ...(rankedSection.item_ids
          .map((id) => original.items.find((item) => item.id === id))
          .filter(Boolean) as CanonItem<unknown>[]),
        ...original.items.filter((item) => !selectedSet.has(item.id)),
      ]

      aiSectionIds.push({
        item_type_id: rankedSection.item_type_id,
        item_ids: rankedSection.item_ids.filter((id) =>
          original.items.some((item) => item.id === id)
        ),
      })

      return { ...original, items: reorderedItems }
    })
    .filter(Boolean) as Section[]

  return { displaySections, aiSectionIds }
}

// -- Hook ---------------------------------------------------------------------

/**
 * Applies AI prioritization (section/item ordering only) to working resume sections.
 * This hook does not generate or merge wording overrides.
 *
 * @param sections - Current section list with ordered items.
 * @param setSections - Setter for local display section ordering.
 * @param workingState - Current persisted working state snapshot.
 * @param updateStateLocally - Local working-state updater.
 * @returns Prioritization loading state and trigger callback.
 */
export function useTailorPrioritization(
  sections: Section[],
  setSections: (next: Section[]) => void,
  workingState: WorkingState,
  updateStateLocally: (state: WorkingState) => void
) {
  // -- State -------------------------------------------------------------------

  const [tailoring, setTailoring] = useState(false)

  // -- Handlers ----------------------------------------------------------------

  /**
   * Runs the prioritize endpoint and updates local section ordering state.
   *
   * @param payload - Context and axis inputs used for prioritization.
   * @returns Promise that resolves when prioritization completes.
   */
  const handleTailor = useCallback(
    async (payload: TailorPrioritizationPayload) => {
      setTailoring(true)
      try {
        const sectionPayloads = buildSectionPayloads(sections)

        const prioritizationInput =
          payload.contextType === "job_description"
            ? payload.contextText
            : `Audience/Area target:\n${payload.contextText}`
        const result = await tailorPrioritize(prioritizationInput, sectionPayloads)

        const { displaySections, aiSectionIds } = mapPrioritizedSections(sections, result.sections)

        const includedTypeIds = new Set(displaySections.map((s) => s.typeId))
        const remaining = sections.filter((s) => !includedTypeIds.has(s.typeId))

        setSections([...displaySections, ...remaining])

        updateStateLocally({
          sections: aiSectionIds,
          ...(workingState.overrides ? { overrides: workingState.overrides } : {}),
          ...(workingState.template_id ? { template_id: workingState.template_id } : {}),
          ...(workingState.tailoring_context
            ? { tailoring_context: workingState.tailoring_context }
            : {}),
        })

        toast.success("Tailoring applied")
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Tailoring failed")
      } finally {
        setTailoring(false)
      }
    },
    [sections, setSections, workingState, updateStateLocally]
  )

  return { tailoring, handleTailor }
}
