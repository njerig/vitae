"use client"

import { useState, useEffect, useCallback } from "react"
import toast from "react-hot-toast"

type SectionState = {
  item_type_id: string
  item_ids: string[]
}

export type OverrideData = {
  title?: string
  content?: Record<string, unknown>
}

type WorkingState = {
  sections: SectionState[]
  overrides?: Record<string, OverrideData>
}

export function useWorkingState() {
  const [state, setState] = useState<WorkingState>({ sections: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)

  useEffect(() => {
    async function fetchState() {
      try {
        const res = await fetch("/api/working-state")
        if (res.ok) {
          const data = await res.json()
          setState(data.state || { sections: [] })
          setUpdatedAt(data.updated_at || null)
        }
      } catch (error) {
        console.error("Failed to fetch working state:", error)
        toast.error("Failed to load your working state")
      } finally {
        setLoading(false)
      }
    }
    fetchState()
  }, [])

  const isSelected = useCallback((itemId: string): boolean => {
    const result = state.sections.some(section =>
      section.item_ids.includes(itemId)
    )
    return result
  }, [state, updateCount])

  const saveState = useCallback(async (newState: WorkingState) => {
    setSaving(true)
    try {
      const res = await fetch("/api/working-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState)
      })
      if (!res.ok) {
        console.error("Failed to save working state")
        toast.error("Failed to save your working state")
      } else {
        console.log("Saved working state:", newState)
        const data = await res.json()
        setState(newState)
        setUpdatedAt(data.updated_at || null)
      }
    } catch (error) {
      console.error("Error saving working state:", error)
      toast.error("Failed to save your working state")
    } finally {
      setSaving(false)
    }
  }, [])

  const toggleItem = useCallback((itemId: string, itemTypeId: string) => {
    setState(prev => {
      const newState = { ...prev, sections: [...prev.sections] }

      let section = newState.sections.find(s => s.item_type_id === itemTypeId)

      if (!section) {
        section = { item_type_id: itemTypeId, item_ids: [] }
        newState.sections.push(section)
      } else {
        const sectionIndex = newState.sections.indexOf(section)
        section = { ...section, item_ids: [...section.item_ids] }
        newState.sections[sectionIndex] = section
      }

      const index = section.item_ids.indexOf(itemId)
      if (index > -1) {
        section.item_ids.splice(index, 1)
        newState.sections = newState.sections.filter(s => s.item_ids.length > 0)
      } else {
        section.item_ids.push(itemId)
      }

      saveState(newState)

      setUpdateCount(c => c + 1)

      return newState
    })
  }, [saveState])

  // Get override for a specific item
  const getOverride = useCallback((itemId: string): OverrideData | undefined => {
    return state.overrides?.[itemId]
  }, [state])

  // Save override for a specific item
  const saveOverride = useCallback(async (itemId: string, override: OverrideData) => {
    const newState: WorkingState = {
      ...state,
      overrides: {
        ...(state.overrides || {}),
        [itemId]: override,
      },
    }
    setState(newState)
    await saveState(newState)
  }, [state, saveState])

  // Clear override for a specific item (reset to canon original)
  const clearOverride = useCallback(async (itemId: string) => {
    const newOverrides = { ...(state.overrides || {}) }
    delete newOverrides[itemId]
    const newState: WorkingState = {
      ...state,
      overrides: Object.keys(newOverrides).length > 0 ? newOverrides : undefined,
    }
    setState(newState)
    await saveState(newState)
  }, [state, saveState])

  return {
    state,
    loading,
    saving,
    isSelected,
    toggleItem,
    saveState,
    updatedAt,
    getOverride,
    saveOverride,
    clearOverride,
  }
}
