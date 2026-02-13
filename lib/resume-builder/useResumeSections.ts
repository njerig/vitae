import { useState, useMemo, useCallback, useEffect } from "react"
import type { CanonItem, ItemType } from "@/lib/types"

type Section = {
  typeName: string
  typeId: string
  items: CanonItem[]
}

type WorkingState = {
  sections: Array<{
    item_type_id: string
    item_ids: string[]
  }>
}

export function useResumeSections(
  allItems: CanonItem[],
  itemTypes: ItemType[],
  workingState: WorkingState | null,
  workingStateLoading: boolean
) {
  const [localSections, setLocalSections] = useState<Section[] | null>(null)
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const computedSections = useMemo<Section[]>(() => {
    return itemTypes
      .map(type => ({
        typeName: type.display_name,
        typeId: type.id,
        items: allItems
          .filter(item => item.item_type_id === type.id)
          .sort((a, b) => a.position - b.position)
      }))
      .filter(section => section.items.length > 0)
  }, [allItems, itemTypes])

  const sections = localSections ?? computedSections

  // Load initial state from workingState when available
  useEffect(() => {
    if (
      workingStateLoading ||
      hasLoadedInitialState ||
      !workingState?.sections ||
      computedSections.length === 0
    ) {
      return
    }

    const reorderedSections = computedSections.map(section => {
      const saved = workingState.sections.find(
        s => s.item_type_id === section.typeId
      )

      if (!saved) return section

      const orderedItems = saved.item_ids
        .map(id => section.items.find(item => item.id === id))
        .filter(Boolean) as CanonItem[]

      const missingItems = section.items.filter(
        item => !saved.item_ids.includes(item.id)
      )

      return { ...section, items: [...orderedItems, ...missingItems] }
    })

    const orderedSections = workingState.sections
      .map(saved =>
        reorderedSections.find(s => s.typeId === saved.item_type_id)
      )
      .filter(Boolean) as Section[]

    const missingSections = reorderedSections.filter(
      section =>
        !workingState.sections.some(
          s => s.item_type_id === section.typeId
        )
    )

    const finalSections = [...orderedSections, ...missingSections]

    setLocalSections(finalSections)
    setHasLoadedInitialState(true)
  }, [workingStateLoading, workingState, computedSections, hasLoadedInitialState])

  const setSections = useCallback(
    (next: Section[]) => {
      setLocalSections(prev => (prev === next ? prev : next))
      setHasUnsavedChanges(true)
    },
    []
  )

  // Get the current state to save
  const getStateToSave = useCallback((): WorkingState => {
    return {
      sections: sections.map(section => ({
        item_type_id: section.typeId,
        item_ids: section.items.map(item => item.id)
      }))
    }
  }, [sections])

  // Mark as saved (called after successful save)
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false)
  }, [])

  return { 
    sections, 
    setSections, 
    hasUnsavedChanges, 
    getStateToSave, 
    markAsSaved 
  }
}