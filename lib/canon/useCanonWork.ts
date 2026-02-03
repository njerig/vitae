// Frontend hook for work experience items
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import type { CanonItem, ItemType, WorkContent } from "@/lib/types"
import { createCanonItem, deleteCanonItem, listCanonItems, listItemTypes, patchCanonItem } from "./api"

// handles loading and error states for the UI
// gets the user's auth token and sends it to API
export function useCanonWork() {
  const { getToken } = useAuth()

  const [items, setItems] = useState<CanonItem<WorkContent>[]>([])
  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Find the "Work Experience" item type ID
  const workTypeId = useMemo(() => {
    return itemTypes.find((t) => t.display_name === "Work Experience")?.id
  }, [itemTypes])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error("Missing auth token")

      // Fetch item types first
      const types = await listItemTypes(token)
      setItemTypes(types)

      // Find work type and fetch items
      const workType = types.find((t) => t.display_name === "Work Experience")
      if (workType) {
        const rows = await listCanonItems<WorkContent>(token, workType.id)
        setItems(rows)
      } else {
        setItems([])
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to load"
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createWork = useCallback(
    async (input: { title: string; position: number; content: WorkContent }) => {
      if (!workTypeId) throw new Error("Work Experience item type not found")

      setSaving(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new Error("Missing auth token")

        const created = await createCanonItem<WorkContent>(token, {
          item_type_id: workTypeId,
          ...input,
        })
        setItems((prev) => [...prev, created].sort((a, b) => a.position - b.position))
        return created
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Create failed"
        setError(message)
        throw e
      } finally {
        setSaving(false)
      }
    },
    [getToken, workTypeId],
  )

  const patchWork = useCallback(
    async (id: string, patch: { title?: string; position?: number; content?: WorkContent }) => {
      setSaving(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new Error("Missing auth token")

        const updated = await patchCanonItem<WorkContent>(token, id, patch)
        setItems((prev) => prev.map((x) => (x.id === id ? updated : x)))
        return updated
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Update failed"
        setError(message)
        throw e
      } finally {
        setSaving(false)
      }
    },
    [getToken],
  )

  const removeWork = useCallback(
    async (id: string) => {
      setSaving(true)
      setError(null)
      try {
        const token = await getToken()
        if (!token) throw new Error("Missing auth token")

        await deleteCanonItem(token, id)
        setItems((prev) => prev.filter((x) => x.id !== id))
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Delete failed"
        setError(message)
        throw e
      } finally {
        setSaving(false)
      }
    },
    [getToken],
  )

  const stats = useMemo(() => {
    const total = items.length
    const allSkills = items.flatMap((i) => i.content?.skills ?? [])
    const uniqueSkills = new Set(allSkills).size
    return { total, totalSkills: allSkills.length, uniqueSkills }
  }, [items])

  return {
    items,
    itemTypes,
    workTypeId,
    stats,
    loading,
    saving,
    error,
    refresh,
    createWork,
    patchWork,
    removeWork,
  }
}
