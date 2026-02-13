import { useState, useCallback } from "react"
import type { CanonItem } from "@/lib/types"

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
  const [pendingPositionUpdates, setPendingPositionUpdates] = useState<
    Map<string, number>
  >(new Map())

  const handleItemDragEnd = useCallback(() => {
    if (!draggedItem) return

    const { sectionIndex } = draggedItem
    const section = sections[sectionIndex]

    if (!section || section.items.length <= 1) {
      setDraggedItem(null)
      return
    }

    // Track position changes locally 
    const updates = new Map(pendingPositionUpdates)
    section.items.forEach((item, index) => {
      if (item.position !== index) {
        updates.set(item.id, index)
      }
    })

    setPendingPositionUpdates(updates)
    setDraggedItem(null)
  }, [draggedItem, sections, pendingPositionUpdates])

  // Get all pending position updates to save
  const getPendingUpdates = useCallback(() => {
    return Array.from(pendingPositionUpdates.entries()).map(([itemId, position]) => ({
      itemId,
      position
    }))
  }, [pendingPositionUpdates])

  // Clear pending updates after successful save
  const clearPendingUpdates = useCallback(() => {
    setPendingPositionUpdates(new Map())
  }, [])

  const isDragging = draggedItem !== null || draggedSection !== null
  const hasUnsavedPositions = pendingPositionUpdates.size > 0

  return {
    draggedItem,
    setDraggedItem,
    draggedSection,
    setDraggedSection,
    handleItemDragEnd,
    isDragging,
    hasUnsavedPositions,
    getPendingUpdates,
    clearPendingUpdates
  }
}