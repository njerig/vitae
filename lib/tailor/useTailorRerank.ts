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

export function useTailorRerank(
  sections: Section[],
  setSections: (next: Section[]) => void
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

        // Reorder sections based on AI response
        const reordered = result.sections
          .map((rs) => {
            const original = sections.find((s) => s.typeId === rs.item_type_id)
            if (!original) return null
            return {
              ...original,
              items: rs.item_ids
                .map((id) => original.items.find((item) => item.id === id))
                .filter(Boolean) as CanonItem<unknown>[],
            }
          })
          .filter(Boolean) as Section[]

        // Add back any sections the AI omitted (at the end, unmodified)
        const includedTypeIds = new Set(reordered.map((s) => s.typeId))
        const remaining = sections.filter((s) => !includedTypeIds.has(s.typeId))

        setSections([...reordered, ...remaining])
        toast.success("Tailoring applied")
        setShowTailorModal(false)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Tailoring failed")
      } finally {
        setTailoring(false)
      }
    },
    [sections, setSections]
  )

  return { showTailorModal, setShowTailorModal, tailoring, handleTailor }
}
