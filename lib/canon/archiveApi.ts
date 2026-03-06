import type { ArchivedCanonItem, CanonItem } from "@/lib/shared/types"
import toast from "react-hot-toast"

// Returns a readable error or throws for the caller to handle
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    const errorMessage = data?.error || `HTTP ${res.status}: ${res.statusText}`
    toast.error(errorMessage)
    throw new Error(errorMessage)
  }
  return res.json()
}

/**
 * Fetches all archived (soft-deleted) canon items for the current user.
 * Items are ordered newest-deleted first. Expired items (>30 days) are pruned
 * server-side before this list is returned.
 *
 * @returns A promise resolving to an array of ArchivedCanonItem objects.
 */
export async function listArchivedItems(): Promise<ArchivedCanonItem[]> {
  const res = await fetch(`/api/archive`, { cache: "no-store" })
  return handleResponse<ArchivedCanonItem[]>(res)
}

/**
 * Restores an archived item back to the user's live canon list.
 * The item is removed from the archive and re-inserted into canon_items.
 *
 * @param id The UUID of the archived item to restore.
 * @returns A promise resolving to the restored CanonItem.
 */
export async function restoreArchivedItem(id: string): Promise<CanonItem> {
  const res = await fetch(`/api/archive?id=${encodeURIComponent(id)}`, {
    method: "POST",
  })
  return handleResponse<CanonItem>(res)
}

/**
 * Permanently deletes an archived item (bypasses the 30-day TTL).
 * This action cannot be undone.
 *
 * @param id The UUID of the archived item to permanently delete.
 */
export async function permanentlyDeleteArchivedItem(id: string): Promise<void> {
  const res = await fetch(`/api/archive?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  if (res.status === 204) return
  await handleResponse(res)
}
