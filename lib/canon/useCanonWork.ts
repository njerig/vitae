// lib/canon/useCanonWork.ts (frontend hook; gets Clerk token and calls api.ts)
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import type { CanonItem, WorkContent } from "@/lib/types"
import { createCanonItem, deleteCanonItem, listCanonItems, patchCanonItem } from "./api"

export function useCanonWork() {
  const { getToken } = useAuth()

  const [items, setItems] = useState<CanonItem<WorkContent>[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = (await getToken()) ?? ""
      if (!token) throw new Error("Missing auth token")

      const rows = await listCanonItems(token, "work")
      setItems(rows)
    } catch (e: any) {
      setError(e?.message ?? "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createWork = useCallback(
    async (input: { title: string; position: number; content: WorkContent }) => {
      setSaving(true)
      setError(null)
      try {
        const token = (await getToken()) ?? ""
        if (!token) throw new Error("Missing auth token")

        const created = await createCanonItem(token, { item_type: "work", ...input })
        setItems((prev) => [...prev, created].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)))
        return created
      } catch (e: any) {
        setError(e?.message ?? "Create failed")
        throw e
      } finally {
        setSaving(false)
      }
    },
    [getToken],
  )

  const patchWork = useCallback(
    async (id: string, patch: { title?: string; position?: number; content?: WorkContent }) => {
      setSaving(true)
      setError(null)
      try {
        const token = (await getToken()) ?? ""
        if (!token) throw new Error("Missing auth token")

        const updated = await patchCanonItem(token, id, patch)
        setItems((prev) => prev.map((x) => (x.id === id ? updated : x)))
        return updated
      } catch (e: any) {
        setError(e?.message ?? "Update failed")
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
        const token = (await getToken()) ?? ""
        if (!token) throw new Error("Missing auth token")

        await deleteCanonItem(token, id)
        setItems((prev) => prev.filter((x) => x.id !== id))
      } catch (e: any) {
        setError(e?.message ?? "Delete failed")
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

  return { items, stats, loading, saving, error, refresh, createWork, patchWork, removeWork }
}
