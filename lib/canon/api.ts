// API client for canon items and item types

import type { CanonItem, ItemType } from "@/lib/types"

// Returns a success or error message from the API to the frontend
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => null) // read error from backend without crashing

    // Extract readable error from Zod issues if present
    if (data?.issues && Array.isArray(data.issues)) {
      const messages = data.issues.map((i: { message?: string; path?: string[] }) =>
        i.path?.length ? `${i.path.join(".")}: ${i.message}` : i.message,
      )
      throw new Error(messages.join("; "))
    }

    // catch any other errors that didn't come from zod
    throw new Error(data?.error || `HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

// Build the auth header more easily
function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

// ─────────────────────────────────────────────────────────────
// Item Types API
// ─────────────────────────────────────────────────────────────

// ?? Actually create the frontend components to make these
// Lists the item types
export async function listItemTypes(token: string): Promise<ItemType[]> {
  const res = await fetch(`/api/item-types`, {
    cache: "no-store",
    headers: authHeader(token),
  })
  return handleResponse<ItemType[]>(res)
}

// Creates an item type
export async function createItemType(token: string, input: { display_name: string }): Promise<ItemType> {
  const res = await fetch(`/api/item-types`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(input),
  })
  return handleResponse<ItemType>(res)
}

// ─────────────────────────────────────────────────────────────
// Canon Items API
// ─────────────────────────────────────────────────────────────

// Lists the canon items; allows a user to specifically get one of a type or all canon items
export async function listCanonItems<T = unknown>(token: string, itemTypeId?: string): Promise<CanonItem<T>[]> {
  // build query string based on if the item type was provided
  const qs = itemTypeId ? `?item_type_id=${encodeURIComponent(itemTypeId)}` : ""
  const res = await fetch(`/api/canon${qs}`, {
    cache: "no-store",
    headers: authHeader(token),
  })
  return handleResponse<CanonItem<T>[]>(res)
}

// Creates a canon item, only for work items though
export async function createCanonItem<T = unknown>(
  token: string,
  input: {
    item_type_id: string
    title?: string
    position?: number
    content?: T
  },
): Promise<CanonItem<T>> {
  const res = await fetch(`/api/canon`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(input),
  })
  return handleResponse<CanonItem<T>>(res)
}

// Updates a canon item based on an item's ID
export async function patchCanonItem<T = unknown>(
  token: string,
  id: string,
  patch: { title?: string; position?: number; content?: Partial<T> },
): Promise<CanonItem<T>> {
  const res = await fetch(`/api/canon?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(patch),
  })
  return handleResponse<CanonItem<T>>(res)
}

// Deletes a canon item based on an item's ID
export async function deleteCanonItem(token: string, id: string): Promise<void> {
  const res = await fetch(`/api/canon?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeader(token),
  })
  // If the response is 204, it means the item was deleted successfully, (backend called .send())
  if (res.status === 204) return
  await handleResponse(res)
}
