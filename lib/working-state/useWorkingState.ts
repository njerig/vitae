"use client"

import { useState, useEffect, useCallback } from "react"

type SectionState = {
  item_type_id: string
  item_ids: string[]
}

type WorkingState = {
  sections: SectionState[]
}

export function useWorkingState() {
  const [state, setState] = useState<WorkingState>({ sections: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)

  useEffect(() => {
    async function fetchState() {
      try {
        const res = await fetch("/api/working-state")
        if (res.ok) {
          const data = await res.json()
          setState(data.state || { sections: [] })
        }
      } catch (error) {
        console.error("Failed to fetch working state:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchState()
  }, [])

  // Check if an item is selected
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
      } else {
        console.log("Saved working state:", newState)
      }
    } catch (error) {
      console.error("Error saving working state:", error)
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

  return {
    state,
    loading,
    saving,
    isSelected,
    toggleItem
  }
}
