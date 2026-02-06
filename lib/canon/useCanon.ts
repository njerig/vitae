// Generic hook for managing canon items of any type
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { CanonItem, ItemType } from "@/lib/types"
import { createCanonItem, deleteCanonItem, listCanonItems, listItemTypes, patchCanonItem, ValidationError } from "./api"

// Error state type for structured validation errors
export type FormError = { message: string; fields: string[] } | null

// handles loading and error states for the UI
// Auth is handled automatically via Clerk cookies
export function useCanon() {
  const [items, setItems] = useState<CanonItem<unknown>[]>([])
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<FormError>(null)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null) // null = show all

  // Fetch item types and items
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const types = await listItemTypes()
      
      // Deduplicate by display_name, handling singular/plural variants
      const normalize = (name: string) => {
        const lower = name.toLowerCase().trim()
        // Remove trailing 's' for plural forms
        return lower.endsWith('s') && !lower.endsWith('ss') ? lower.slice(0, -1) : lower
      }
      
      const uniqueTypes = types.filter((type, index, self) => {
        const normalizedName = normalize(type.display_name)
        return index === self.findIndex((t) => normalize(t.display_name) === normalizedName)
      })
      
      setItemTypes(uniqueTypes)

      // Fetch items (all or filtered by type)
      const rows = await listCanonItems(selectedTypeId ?? undefined)
      setItems(rows)
    } catch (e: unknown) {
      if (e instanceof ValidationError) {
        setError({ message: e.message, fields: e.fields })
      } else {
        const message = e instanceof Error ? e.message : "Failed to load"
        setError({ message, fields: [] })
      }
    } finally {
      setLoading(false)
    }
  }, [selectedTypeId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Get display name for a type ID
  const getTypeName = useCallback((typeId: string) => itemTypes.find((t) => t.id === typeId)?.display_name ?? "Unknown", [itemTypes])

  // Create a new item
  const create = useCallback(
    async (input: { item_type_id: string; title?: string; position?: number; content?: unknown }) => {
      setSaving(true)
      setError(null)
      try {
        const created = await createCanonItem(input)
        setItems((prev) => [...prev, created].sort((a, b) => a.position - b.position))
        return created
      } catch (e: unknown) {
        if (e instanceof ValidationError) {
          setError({ message: e.message, fields: e.fields })
        } else {
          const message = e instanceof Error ? e.message : "Create failed"
          setError({ message, fields: [] })
        }
        throw e
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  // Update an item
  const patch = useCallback(
    async (id: string, patchData: { title?: string; position?: number; content?: unknown }) => {
      setSaving(true)
      setError(null)
      try {
        const updated = await patchCanonItem(id, patchData)
        setItems((prev) => prev.map((x) => (x.id === id ? updated : x)))
        return updated
      } catch (e: unknown) {
        if (e instanceof ValidationError) {
          setError({ message: e.message, fields: e.fields })
        } else {
          const message = e instanceof Error ? e.message : "Update failed"
          setError({ message, fields: [] })
        }
        throw e
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  // Delete an item
  const remove = useCallback(
    async (id: string) => {
      setSaving(true)
      setError(null)
      try {
        await deleteCanonItem(id)
        setItems((prev) => prev.filter((x) => x.id !== id))
      } catch (e: unknown) {
        if (e instanceof ValidationError) {
          setError({ message: e.message, fields: e.fields })
        } else {
          const message = e instanceof Error ? e.message : "Delete failed"
          setError({ message, fields: [] })
        }
        throw e
      } finally {
        setSaving(false)
      }
    },
    [],
  )

  // Type priority for sorting (lower number = higher priority)
  const getTypePriority = useCallback((typeId: string) => {
    const typeName = getTypeName(typeId).toLowerCase()
    if (typeName.includes('work')) return 1
    if (typeName.includes('education')) return 2
    if (typeName.includes('project')) return 3
    if (typeName.includes('skill')) return 4
    if (typeName.includes('link')) return 5
    return 99 // Unknown types go last
  }, [getTypeName])

  // Filter items by selected type and sort by type priority, then position
  const filteredItems = useMemo(() => {
    const filtered = selectedTypeId ? items.filter((item) => item.item_type_id === selectedTypeId) : items
    return filtered.sort((a, b) => {
      const typeDiff = getTypePriority(a.item_type_id) - getTypePriority(b.item_type_id)
      if (typeDiff !== 0) return typeDiff
      return a.position - b.position
    })
  }, [items, selectedTypeId, getTypePriority])

  // Stats
  const stats = useMemo(() => {
    return {
      total: filteredItems.length,
      byType: itemTypes.map((t) => ({
        id: t.id,
        name: t.display_name,
        count: items.filter((i) => i.item_type_id === t.id).length,
      })),
    }
  }, [filteredItems, items, itemTypes])

  return {
    items: filteredItems,
    allItems: items,
    itemTypes,
    selectedTypeId,
    setSelectedTypeId,
    getTypeName,
    stats,
    loading,
    saving,
    error,
    setError,
    refresh,
    create,
    patch,
    remove,
  }
}