import type { CanonItem, WorkContent } from "@/lib/types"

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const txt = await res.text().catch(() => "")
    throw new Error(`HTTP ${res.status}: ${txt || res.statusText}`)
  }
  return res.json()
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` }
}

export async function listCanonItems(token: string, item_type?: string) {
  const qs = item_type ? `?item_type=${encodeURIComponent(item_type)}` : ""
  const res = await fetch(`/api/canon${qs}`, {
    cache: "no-store",
    headers: authHeader(token),
  })
  return jsonOrThrow<CanonItem<WorkContent>[]>(res)
}

export async function createCanonItem(token: string, input: { item_type: "work"; title: string; position: number; content: WorkContent }) {
  const res = await fetch(`/api/canon`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(input),
  })
  return jsonOrThrow<CanonItem<WorkContent>>(res)
}

export async function patchCanonItem(token: string, id: string, patch: { title?: string; position?: number; content?: WorkContent }) {
  const res = await fetch(`/api/canon?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeader(token) },
    body: JSON.stringify(patch),
  })
  return jsonOrThrow<CanonItem<WorkContent>>(res)
}

export async function deleteCanonItem(token: string, id: string) {
  const res = await fetch(`/api/canon?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: authHeader(token),
  })
  if (res.status === 204) return
  await jsonOrThrow(res)
}
