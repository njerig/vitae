import { useState, useCallback } from "react"
import type { CanonItem } from "@/lib/types"

type Section = {
  typeName: string
  typeId: string
  items: CanonItem[]
}

export function useDragState(
  sections: Section[],
  saveItemPosition: (itemId: string, position: number) => Promise<void>
) {
  const [draggedItem, setDraggedItem] = useState<{
    sectionIndex: number
    itemIndex: number
  } | null>(null)

  const [draggedSection, setDraggedSection] = useState<number | null>(null)

  const handleItemDragEnd = useCallback(() => {
    if (!draggedItem) return

    const { sectionIndex } = draggedItem
    const section = sections[sectionIndex]

    if (!section || section.items.length <= 1) {
      setDraggedItem(null)
      return
    }

    const hasOrderChanged = section.items.some(
      (item, index) => item.position !== index
    )

    if (!hasOrderChanged) {
      setDraggedItem(null)
      return
    }

    section.items.forEach((item, index) => {
      if (item.position !== index) {
        saveItemPosition(item.id, index)
      }
    })

    setDraggedItem(null)
  }, [draggedItem, sections, saveItemPosition])

  const isDragging = draggedItem !== null || draggedSection !== null

  return {
    draggedItem,
    setDraggedItem,
    draggedSection,
    setDraggedSection,
    handleItemDragEnd,
    isDragging
  }
}
