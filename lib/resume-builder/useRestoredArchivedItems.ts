"use client"

import { useState } from "react"
import type { ArchivedCanonItem } from "@/lib/shared/types"

/**
 * Reads archived canon items restored for a specific parent version.
 *
 * @param versionId - Parent version ID used as the storage key suffix.
 * @returns Archived items when available; otherwise null.
 */
function readArchivedItemsFromSession(versionId: string): ArchivedCanonItem[] | null {
  const key = `archived_items_${versionId}`
  const raw = sessionStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ArchivedCanonItem[]
  } catch {
    return null
  } finally {
    sessionStorage.removeItem(key)
  }
}

/**
 * Retrieves archived items restored from version history once on mount.
 *
 * @param parentVersionId - Parent version ID used as storage key suffix.
 * @returns Archived canon items restored for preview rendering.
 */
export function useRestoredArchivedItems(parentVersionId: string | null): ArchivedCanonItem[] {
  const [archivedItems] = useState<ArchivedCanonItem[]>(() => {
    if (!parentVersionId) return []
    return readArchivedItemsFromSession(parentVersionId) ?? []
  })

  return archivedItems
}
