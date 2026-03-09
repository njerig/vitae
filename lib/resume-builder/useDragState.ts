import { useState, useCallback } from "react"
import type { CanonItem } from "@/lib/shared/types"

type Section = {
  typeName: string
  typeId: string
  items: CanonItem[]
}

export function useDragState(sections: Section[]) {
  const [draggedItem, setDraggedItem] = useState<{
    sectionIndex: number
    itemIndex: number
  } | null>(null)

  const [draggedSection, setDraggedSection] = useState<number | null>(null)

  // cleans up state if the drag ends without hitting a valid drop target
  const handleItemDragEnd = useCallback(() => {
    setDraggedItem(null)
  }, [])

  const isDragging = draggedItem !== null || draggedSection !== null

  return {
    draggedItem,
    setDraggedItem,
    draggedSection,
    setDraggedSection,
    handleItemDragEnd,
    isDragging,
  }
}
