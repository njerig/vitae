import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import type { CanonItem, ItemType } from "@/lib/types"

type Section = {
  typeName: string
  typeId: string
  items: CanonItem[]
}

type OverrideData = {
  title?: string
  content?: Record<string, unknown>
}

type WorkingState = {
  sections: Array<{
    item_type_id: string
    item_ids: string[]
  }>
  overrides?: Record<string, OverrideData>
}

function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    },
    [delay]
  )
}

export function useResumeSections(
  allItems: CanonItem[],
  itemTypes: ItemType[],
  workingState: WorkingState | null,
  workingStateLoading: boolean,
  saveState: (state: WorkingState) => void
) {
  const [localSections, setLocalSections] = useState<Section[] | null>(null)
  const [lastSavedState, setLastSavedState] = useState("")
  const [hasLoadedInitialState, setHasLoadedInitialState] = useState(false)

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

  const baseSections = localSections ?? computedSections

  // Apply overrides as a FINAL step — this runs reactively whenever overrides
  // change, so edits show immediately without requiring a page refresh.
  const sections = useMemo<Section[]>(() => {
    const overrides = workingState?.overrides
    if (!overrides || Object.keys(overrides).length === 0) return baseSections
    return baseSections.map(section => ({
      ...section,
      items: section.items.map(item => {
        const override = overrides[item.id]
        if (!override) return item
        return {
          ...item,
          title: override.title ?? item.title,
          content: override.content
            ? { ...(item.content as Record<string, unknown>), ...override.content }
            : item.content,
        }
      }),
    }))
  }, [baseSections, workingState?.overrides])

  const debouncedSave = useDebounce((sectionsToSave: Section[]) => {
    const newWorkingState: WorkingState = {
      sections: sectionsToSave.map(section => ({
        item_type_id: section.typeId,
        item_ids: section.items.map(item => item.id)
      })),
      ...(workingState?.overrides ? { overrides: workingState.overrides } : {}),
    }

    const serialized = JSON.stringify(newWorkingState)
    if (serialized !== lastSavedState) {
      saveState(newWorkingState)
      setLastSavedState(serialized)
    }
  }, 1000)

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

    setLastSavedState(
      JSON.stringify({
        sections: finalSections.map(section => ({
          item_type_id: section.typeId,
          item_ids: section.items.map(item => item.id)
        }))
      })
    )
  }, [workingStateLoading, workingState, computedSections, hasLoadedInitialState])

  const setSections = useCallback(
    (next: Section[]) => {
      setLocalSections(prev => (prev === next ? prev : next))
      debouncedSave(next)
    },
    [debouncedSave]
  )

  return { sections, setSections }
}