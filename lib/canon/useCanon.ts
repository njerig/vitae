"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { CanonItem, ItemType } from "@/lib/types"
import {
  createCanonItem,
  deleteCanonItem,
  listCanonItems,
  listItemTypes,
  patchCanonItem,
  ValidationError,
} from "./api"

// Error state type for structured validation errors
export type FormError = { message: string; fields: string[] } | null

export function useCanon() {
  const [items, setItems] = useState<CanonItem<unknown>[]>([])
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<FormError>(null)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null) // null = show all

  // Form state
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<CanonItem<unknown> | null>(null)
  const [deletingItem, setDeletingItem] = useState<CanonItem<unknown> | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

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
        return lower.endsWith("s") && !lower.endsWith("ss") ? lower.slice(0, -1) : lower
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

  // Auto-scroll to form when it opens
  useEffect(() => {
    if (isAddingItem && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [isAddingItem])

  // Get display name for a type ID
  const getTypeName = useCallback(
    (typeId: string) => itemTypes.find((t) => t.id === typeId)?.display_name ?? "Unknown",
    [itemTypes]
  )

  // Create a new item
  const create = useCallback(
    async (input: {
      item_type_id: string
      title?: string
      position?: number
      content?: unknown
    }) => {
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
    []
  )

  // Update an item with partial data
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
    []
  )

  // Delete an item
  const remove = useCallback(async (id: string) => {
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
  }, [])

  // Type priority for sorting (lower number = higher priority)
  const getTypePriority = useCallback(
    (typeId: string) => {
      const typeName = getTypeName(typeId).toLowerCase()
      if (typeName.includes("work")) return 1
      if (typeName.includes("education")) return 2
      if (typeName.includes("project")) return 3
      if (typeName.includes("skill")) return 4
      if (typeName.includes("link")) return 5
      return 99 // Unknown types go last
    },
    [getTypeName]
  )

  // Filter items by selected type and sort by type priority, then position
  const filteredItems = useMemo(() => {
    const filtered = selectedTypeId
      ? items.filter((item) => item.item_type_id === selectedTypeId)
      : items
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

  // Get most recent edit timestamp from all items
  const getLastEditedDate = useCallback(() => {
    if (items.length === 0) return null

    const mostRecent = items.reduce((latest, item) => {
      const itemDate = new Date(item.updated_at)
      return itemDate > new Date(latest.updated_at) ? item : latest
    })

    return new Date(mostRecent.updated_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }, [items])

  const startAdd = useCallback(() => {
    setEditingItem(null)
    setError(null)
    setIsAddingItem(true)
  }, [])

  const startEdit = useCallback((item: CanonItem<unknown>) => {
    setEditingItem(item)
    setError(null)
    setIsAddingItem(true)
  }, [])

  const cancel = useCallback(() => {
    setIsAddingItem(false)
    setEditingItem(null)
    setError(null)
  }, [])

  const submit = useCallback(
    async (payload: {
      item_type_id: string
      title: string
      position: number
      content: Record<string, unknown>
    }) => {
      try {
        if (editingItem) {
          await patch(editingItem.id, {
            title: payload.title,
            position: payload.position,
            content: payload.content,
          })
        } else {
          await create(payload)
        }
        cancel()
      } catch {
        // Error is already set in the hook, keep form open
      }
    },
    [editingItem, patch, create, cancel]
  )

  const del = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id) ?? null
      setDeletingItem(item)
    },
    [items]
  )

  const cancelDelete = useCallback(() => {
    setDeletingItem(null)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      await remove(deletingItem.id)
      setDeletingItem(null)
    } finally {
      setIsDeleting(false)
    }
  }, [deletingItem, remove])

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
    // Form/UI state
    isAddingItem,
    editingItem,
    deletingItem,
    isDeleting,
    formRef,
    getLastEditedDate,
    startAdd,
    startEdit,
    cancel,
    submit,
    del,
    cancelDelete,
    confirmDelete,
  }
}
