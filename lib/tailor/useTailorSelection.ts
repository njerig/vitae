"use client"

import { useState, useCallback } from "react"
import toast from "react-hot-toast"
import { tailorSelection } from "@/lib/tailor/api"
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

export function useTailorSelection(
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
        const sectionPayloads = sections.map((section) => ({
          item_type_id: section.typeId,
          type_name: section.typeName,
          items: section.items.map((item) => ({
            id: item.id,
            title: item.title,
            content: item.content as Record<string, unknown>,
          })),
        }))

        const result = await tailorSelection(jobDescription, sectionPayloads)

        const aiSectionIds: { item_type_id: string; item_ids: string[] }[] = []
        const displaySections = result.sections
          .map((rs) => {
            const original = sections.find((s) => s.typeId === rs.item_type_id)
            if (!original) return null

            const selectedSet = new Set(rs.item_ids)
            const reorderedItems = [
              ...(rs.item_ids
                .map((id) => original.items.find((item) => item.id === id))
                .filter(Boolean) as CanonItem<unknown>[]),
              ...original.items.filter((item) => !selectedSet.has(item.id)),
            ]

            aiSectionIds.push({
              item_type_id: rs.item_type_id,
              item_ids: rs.item_ids.filter((id) => original.items.some((item) => item.id === id)),
            })

            return { ...original, items: reorderedItems }
          })
          .filter(Boolean) as Section[]

        const includedTypeIds = new Set(displaySections.map((s) => s.typeId))
        const remaining = sections.filter((s) => !includedTypeIds.has(s.typeId))

        setSections([...displaySections, ...remaining])

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
