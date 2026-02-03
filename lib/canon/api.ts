// lib/canon/api.ts
// API client for canon items and item types

import type { CanonItem, ItemType, WorkContent } from "@/lib/types"

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    // Extract readable error from Zod issues if present
    if (data?.issues && Array.isArray(data.issues)) {
      const messages = data.issues.map((i: { message?: string; path?: string[] }) => 
        i.path?.length ? `${i.path.join(".")}: ${i.message}` : i.message
      )
      throw new Error(messages.join("; "))
    }
    throw new Error(data?.error || `HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// ─────────────────────────────────────────────────────────────
// Item Types API
// ─────────────────────────────────────────────────────────────

export async function listItemTypes(token: string): Promise<ItemType[]> {
  const res = await fetch(`/api/item-types`, {
    cache: "no-store",
    headers: authHeader(token),
  })
  return jsonOrThrow<ItemType[]>(res)
}

export async function createItemType(
  token: string,
  input: { display_name: string }
): Promise<ItemType> {
  const res = await fetch(`/api/item-types`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(input),
  })
  return jsonOrThrow<ItemType>(res)
}

// ─────────────────────────────────────────────────────────────
// Canon Items API
// ─────────────────────────────────────────────────────────────

export async function listCanonItems<T = unknown>(
  token: string,
  itemTypeId?: string
): Promise<CanonItem<T>[]> {
  const qs = itemTypeId ? `?item_type_id=${encodeURIComponent(itemTypeId)}` : ""
  const res = await fetch(`/api/canon${qs}`, {
    cache: "no-store",
    headers: authHeader(token),
  })
  return jsonOrThrow<CanonItem<T>[]>(res)
}

export async function createCanonItem<T = unknown>(
  token: string,
  input: {
    item_type_id: string
    title?: string
    position?: number
    content?: T
  }
): Promise<CanonItem<T>> {
  const res = await fetch(`/api/canon`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(input),
  })
  return jsonOrThrow<CanonItem<T>>(res)
}

export async function patchCanonItem<T = unknown>(
  token: string,
  id: string,
  patch: { title?: string; position?: number; content?: Partial<T> }
): Promise<CanonItem<T>> {
  const res = await fetch(`/api/canon?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(patch),
  })
  return jsonOrThrow<CanonItem<T>>(res)
}

export async function deleteCanonItem(token: string, id: string): Promise<void> {
  const res = await fetch(`/api/canon?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeader(token),
  })
  if (res.status === 204) return
  await jsonOrThrow(res)
}
