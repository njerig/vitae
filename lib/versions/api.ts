import type { Version, VersionGroup } from "@/lib/types"
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
  group_name: "Resume Name",
  name: "Version Note",
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

    // catch any other errors that didn't come from zod
    const errorMessage = data?.error || `HTTP ${res.status}: ${res.statusText}`
    throw new Error(errorMessage)
  }
  return res.json()
}

// ─────────────────────────────────────────────────────────────
// Versions API
// ─────────────────────────────────────────────────────────────

// Lists all the versions
export async function fetchVersion(): Promise<VersionGroup[]> {
  const res = await fetch(`/api/versions`, {
    cache: "no-store",
  })
  return handleResponse(res)
}

export async function deleteVersion(id: string): Promise<Response> {
  const res = await fetch(`/api/versions?id=${id}`, {
    method: "DELETE",
  })
  return handleResponse(res)
}

export async function restoreVersion(id: string): Promise<{ version_id: string }> {
  const res = await fetch(`/api/versions/${id}/restore`, {
    method: "POST",
  })
  return handleResponse(res);
}

export async function saveVersion(groupName: string, versionNote: string, parentVersionId: string | null) {
  const res = await fetch(`/api/versions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      group_name: groupName,
      name: versionNote,
      parent_version_id: parentVersionId,
    }),
  })
  return handleResponse(res);
}