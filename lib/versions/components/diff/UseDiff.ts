"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { diffResumes, ResumeSnapshot, ResumeDiff } from "./diffResumes"
import { fetchVersionSnapshot } from "../../api"
import type { CanonItem, ItemType, VersionGroup } from "@/lib/shared/types"

// Fetches all canon items for the current user
async function fetchAllItems(): Promise<CanonItem[]> {
  const res = await fetch("/api/canon", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch canon items")
  return res.json()
}

// Fetches all item types to resolve display names for sections
async function fetchItemTypes(): Promise<ItemType[]> {
  const res = await fetch("/api/item-types", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch item types")
  return res.json()
}

type UseDiffReturn = {
  versionAId: string
  versionBId: string
  setVersionAId: (id: string) => void
  setVersionBId: (id: string) => void
  versionAName: string | undefined
  versionBName: string | undefined
  diff: ResumeDiff | null
  isLoading: boolean
  error: string | null
  sameVersionSelected: boolean
}

// Manages all state and data fetching for the diff view
export function useDiff(groups: VersionGroup[]): UseDiffReturn {
  const [versionAId, setVersionAId] = useState("")
  const [versionBId, setVersionBId] = useState("")
  const [snapshotA, setSnapshotA] = useState<ResumeSnapshot | null>(null)
  const [snapshotB, setSnapshotB] = useState<ResumeSnapshot | null>(null)
  const [allItems, setAllItems] = useState<CanonItem[]>([])
  const [itemTypeMap, setItemTypeMap] = useState<Record<string, string>>({})
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch canon items and item types once on mount so we can resolve IDs to content
  useEffect(() => {
    Promise.all([fetchAllItems(), fetchItemTypes()])
      .then(([items, types]) => {
        setAllItems(items)
        // Build a lookup map from item_type_id -> display_name
        const typeMap: Record<string, string> = {}
        for (const t of types) typeMap[t.id] = t.display_name
        setItemTypeMap(typeMap)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingMeta(false))
  }, [])

  // Fetch snapshot for version A whenever selection changes
  const loadSnapshotA = useCallback((id: string) => {
    if (!id) {
      setSnapshotA(null)
      return
    }
    setLoadingA(true)
    fetchVersionSnapshot(id)
      .then((snap) => setSnapshotA(snap))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingA(false))
  }, [])

  // Fetch snapshot for version B whenever selection changes
  const loadSnapshotB = useCallback((id: string) => {
    if (!id) {
      setSnapshotB(null)
      return
    }
    setLoadingB(true)
    fetchVersionSnapshot(id)
      .then((snap) => setSnapshotB(snap))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingB(false))
  }, [])

  const handleSetVersionAId = useCallback(
    (id: string) => {
      setVersionAId(id)
      loadSnapshotA(id)
    },
    [loadSnapshotA]
  )

  const handleSetVersionBId = useCallback(
    (id: string) => {
      setVersionBId(id)
      loadSnapshotB(id)
    },
    [loadSnapshotB]
  )

  // Recompute diff only when snapshots or supporting data change
  const diff = useMemo(() => {
    if (!snapshotA || !snapshotB) return null
    return diffResumes(snapshotA, snapshotB, allItems, itemTypeMap)
  }, [snapshotA, snapshotB, allItems, itemTypeMap])

  const allVersions = groups.flatMap((g) => g.versions)
  const versionAName = allVersions.find((v) => v.id === versionAId)?.name
  const versionBName = allVersions.find((v) => v.id === versionBId)?.name
  const isLoading = loadingA || loadingB || loadingMeta
  const sameVersionSelected = Boolean(versionAId && versionBId && versionAId === versionBId)

  return {
    versionAId,
    versionBId,
    setVersionAId: handleSetVersionAId,
    setVersionBId: handleSetVersionBId,
    versionAName,
    versionBName,
    diff,
    isLoading,
    error,
    sameVersionSelected,
  }
}
