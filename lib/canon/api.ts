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

// Labels for field names
const FIELD_LABELS: Record<string, string> = {
  org: "Company",
  role: "Position",
  location: "Location",
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
    // read error from backend without crashing
    const data = await res.json().catch(() => null)

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

    // Catch any other errors that didn't come from zod
    const errorMessage = data?.error || `HTTP ${res.status}: ${res.statusText}`

    // Show a toast (just for canon items though)
    toast.error(errorMessage)
    throw new Error(errorMessage)
  }
  return res.json()
}

// ─────────────────────────────────────────────────────────────
// Item Types API
// ─────────────────────────────────────────────────────────────

/**
 * Retrieves a list of all available item types (e.g., "Work Experience", "Education").
 *
 * @returns A promise resolving to an array of ItemType objects.
 */
export async function listItemTypes(): Promise<ItemType[]> {
  const res = await fetch(`/api/item-types`, {
    cache: "no-store",
  })
  return handleResponse<ItemType[]>(res)
}

/**
 * Creates a new item type.
 *
 * @param input An object containing the display_name for the new item type.
 * @returns A promise resolving to the newly created ItemType.
 */
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

/**
 * Retrieves canon items from the database.
 * If an itemTypeId is provided, filters the results to only include items of that type.
 *
 * @param itemTypeId (Optional) The UUID of the item type to filter by.
 * @returns A promise resolving to an array of CanonItem objects.
 */
export async function listCanonItems<T = unknown>(itemTypeId?: string): Promise<CanonItem<T>[]> {
  // build query string based on if the item type was provided
  const qs = itemTypeId ? `?item_type_id=${encodeURIComponent(itemTypeId)}` : ""
  const res = await fetch(`/api/canon${qs}`, {
    cache: "no-store",
  })
  return handleResponse<CanonItem<T>[]>(res)
}

/**
 * Creates a new canon item (like a new work experience entry) for the user.
 *
 * @param input An object containing fields to create a canon item.
 * @returns A promise resolving to the newly created CanonItem.
 */
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

/**
 * Updates an existing canon item by applying a partial patch.
 *
 * @param id The UUID of the canon item to update.
 * @param patch An object containing the fields to update.
 * @returns A promise resolving to the updated CanonItem.
 */
export async function patchCanonItem<T = unknown>(
  id: string,
  patch: { title?: string; position?: number; content?: T }
): Promise<CanonItem<T>> {
  const res = await fetch(`/api/canon?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
  return handleResponse<CanonItem<T>>(res)
}

/**
 * Deletes a canon item by its UUID.
 *
 * @param id The UUID of the canon item to delete.
 */
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

/**
 * Retrieves the user's current working state (their active resume layout and overrides).
 *
 * @returns A promise resolving to a WorkingStateResponse containing the state and its last updated timestamp.
 */
export async function getWorkingState(): Promise<WorkingStateResponse> {
  const res = await fetch(`/api/working-state`, {
    cache: "no-store",
  })
  return handleResponse<WorkingStateResponse>(res)
}

/**
 * Updates the user's current working state (saving their active resume layout and overrides).
 *
 * @param state The entire new working state to save.
 * @returns A promise resolving to the updated WorkingStateResponse from the server.
 */
export async function updateWorkingState(state: WorkingState): Promise<WorkingStateResponse> {
  const res = await fetch(`/api/working-state`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  })
  return handleResponse<WorkingStateResponse>(res)
}
