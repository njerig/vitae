// API client for canon items and item types
// Auth is handled automatically via Clerk cookies - no token needed

import type { CanonItem, ItemType } from "@/lib/types"
import toast from "react-hot-toast"

// Custom error class that carries both a readable message and the list of invalid field names
export class ValidationError extends Error {
  fields: string[]

  constructor(message: string, fields: string[]) {
    super(message)
    this.name = "ValidationError"
    this.fields = fields
  }
}

// Human-readable labels for field names
const FIELD_LABELS: Record<string, string> = {
  org: "Company",
  role: "Position",
  start: "Start Date",
  end: "End Date",
  bullets: "Bullets",
  skills: "Skills",
  title: "Title",
  position: "Position Order",
  content: "Content",
}

// Returns a success or error message from the API to the frontend
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => null) // read error from backend without crashing

    // Extract readable error from Zod issues if present
    if (data?.issues && Array.isArray(data.issues)) {
      const fields: string[] = []
      const messages = data.issues.map((i: { message?: string; path?: string[] }) => {
        const field = i.path?.[0] ?? ""
        if (field) fields.push(field)
        const label = FIELD_LABELS[field] || field || "Field"
        return `• ${label}: ${i.message}`
      })
      throw new ValidationError(messages.join("\n"), fields)
    }

    // catch any other errors that didn't come from zod - show toast
    const errorMessage = data?.error || `HTTP ${res.status}: ${res.statusText}`
    toast.error(errorMessage)
    throw new Error(errorMessage)
  }
  return res.json()
}

// ─────────────────────────────────────────────────────────────
// Item Types API
// ─────────────────────────────────────────────────────────────

// Lists the item types
export async function listItemTypes(): Promise<ItemType[]> {
  const res = await fetch(`/api/item-types`, {
    cache: "no-store",
  })
  return handleResponse<ItemType[]>(res)
}

// Creates an item type
export async function createItemType(input: { display_name: string }): Promise<ItemType> {
  const res = await fetch(`/api/item-types`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return handleResponse<ItemType>(res)
}

// ─────────────────────────────────────────────────────────────
// Canon Items API
// ─────────────────────────────────────────────────────────────

// Lists the canon items; allows a user to specifically get one of a type or all canon items
export async function listCanonItems<T = unknown>(itemTypeId?: string): Promise<CanonItem<T>[]> {
  // build query string based on if the item type was provided
  const qs = itemTypeId ? `?item_type_id=${encodeURIComponent(itemTypeId)}` : ""
  const res = await fetch(`/api/canon${qs}`, {
    cache: "no-store",
  })
  return handleResponse<CanonItem<T>[]>(res)
}

// Creates a canon item
export async function createCanonItem<T = unknown>(input: {
  item_type_id: string
  title?: string
  position?: number
  content?: T
}): Promise<CanonItem<T>> {
  const res = await fetch(`/api/canon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  return handleResponse<CanonItem<T>>(res)
}

// Updates a canon item based on an item's ID
export async function patchCanonItem<T = unknown>(
  id: string,
  patch: { title?: string; position?: number; content?: T },
): Promise<CanonItem<T>> {
  const res = await fetch(`/api/canon?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  return handleResponse<CanonItem<T>>(res)
}

// Deletes a canon item based on an item's ID
export async function deleteCanonItem(id: string): Promise<void> {
  const res = await fetch(`/api/canon?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  })
  // If the response is 204, it means the item was deleted successfully
  if (res.status === 204) return
  await handleResponse(res)
}

// ─────────────────────────────────────────────────────────────
// Working State API
// ─────────────────────────────────────────────────────────────

export type WorkingState = {
  sections: { item_type_id: string; item_ids: string[] }[]
  overrides?: Record<string, { title?: string; content?: Record<string, unknown> }>
}

export type WorkingStateResponse = {
  state: WorkingState
  updated_at: string | null
}

// Gets the user's current working state
export async function getWorkingState(): Promise<WorkingStateResponse> {
  const res = await fetch(`/api/working-state`, {
    cache: "no-store",
  })
  return handleResponse<WorkingStateResponse>(res)
}

// Updates the user's working state
export async function updateWorkingState(state: WorkingState): Promise<WorkingStateResponse> {
  const res = await fetch(`/api/working-state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  })
  return handleResponse<WorkingStateResponse>(res)
}
