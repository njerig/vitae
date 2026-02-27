// API client for canon items and item types
// Auth is handled automatically via Clerk cookies - no token needed

import type { Version, VersionGroup } from "@/lib/types"
import toast from "react-hot-toast"

// Returns a success or error message from the API to the frontend
async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const data = await res.json().catch(() => null) // read error from backend without crashing

    // catch any other errors that didn't come from zod; show toast
    const errorMessage = data?.error || `HTTP ${res.status}: ${res.statusText}`
    toast.error(errorMessage)
    throw new Error(errorMessage)
  }
  return res.json()
}

// ─────────────────────────────────────────────────────────────
// Versions API
// ─────────────────────────────────────────────────────────────

// Lists the versions
export async function fetchVersion(): Promise<VersionGroup[]> {
  const res = await fetch(`/api/versions`, {
    cache: "no-store",
  })
  return handleResponse(res)
}
