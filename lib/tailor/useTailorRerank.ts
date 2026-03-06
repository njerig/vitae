"use client"

import { useState, useCallback } from "react"
import toast from "react-hot-toast"
import { tailorResume } from "@/lib/tailor/api"
import type { CanonItem } from "@/lib/shared/types"

type Section = {
  typeName: string
  typeId: string
  items: CanonItem[]
}

type WorkingState = {
  sections: { item_type_id: string; item_ids: string[] }[]
  overrides?: Record<string, { title?: string; content?: Record<string, unknown> }>
  template_id?: string
}

export function useTailorRerank(
  sections: Section[],
  setSections: (next: Section[]) => void,
  workingState: WorkingState,
  updateStateLocally: (state: WorkingState) => void
) {
  const [showTailorModal, setShowTailorModal] = useState(false)
  const [tailoring, setTailoring] = useState(false)

  const handleTailor = useCallback(
    async (jobDescription: string) => {
      setTailoring(true)
      try {
        // Build section payloads with item details for the AI
        const sectionPayloads = sections.map((section) => ({
          item_type_id: section.typeId,
          type_name: section.typeName,
          items: section.items.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.content as Record<string, unknown>,
          })),
        }))

        const result = await tailorResume(jobDescription, sectionPayloads)

        // Build display sections: AI-selected items first, then remaining items
        const aiSectionIds: { item_type_id: string; item_ids: string[] }[] = []
        const displaySections = result.sections
          .map((rs) => {
            const original = sections.find((s) => s.typeId === rs.item_type_id)
            if (!original) return null

            const selectedSet = new Set(rs.item_ids)
            // AI-selected items in AI order, then unselected items after
            const reorderedItems = [
              ...(rs.item_ids
                .map((id) => original.items.find((item) => item.id === id))
                .filter(Boolean) as CanonItem<unknown>[]),
              ...original.items.filter((item) => !selectedSet.has(item.id)),
            ]

            // Track only AI-selected IDs for the working state
            aiSectionIds.push({
              item_type_id: rs.item_type_id,
              item_ids: rs.item_ids.filter((id) => original.items.some((item) => item.id === id)),
            })

            return { ...original, items: reorderedItems }
          })
          .filter(Boolean) as Section[]

        // Add any sections the AI omitted (at the end, unmodified)
        const includedTypeIds = new Set(displaySections.map((s) => s.typeId))
        const remaining = sections.filter((s) => !includedTypeIds.has(s.typeId))

        // Update display with all items (reordered)
        setSections([...displaySections, ...remaining])

        // Update working state with only AI-selected IDs (toggles deselect the rest)
        updateStateLocally({
          sections: aiSectionIds,
          ...(workingState.overrides ? { overrides: workingState.overrides } : {}),
          ...(workingState.template_id ? { template_id: workingState.template_id } : {}),
        })

        toast.success("Tailoring applied")
        setShowTailorModal(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Tailoring failed")
      } finally {
        setTailoring(false)
      }
    },
    [sections, setSections, workingState, updateStateLocally]
  )

  return { showTailorModal, setShowTailorModal, tailoring, handleTailor }
}
