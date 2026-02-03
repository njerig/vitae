"use client"

import { useEffect, useMemo, useState } from "react"
import type { CanonItem, WorkContent } from "@/lib/types"

type Props = {
  editing?: CanonItem<WorkContent> | null
  onCancel: () => void
  onSubmit: (payload: { title: string; position: number; content: WorkContent }) => Promise<void> | void
  saving?: boolean
  error?: string | null
}

export function CanonForm({ editing, onCancel, onSubmit, saving, error }: Props) {
  const initial = useMemo(() => {
    const c = editing?.content ?? {}
    return {
      title: editing?.title ?? c.org ?? "",
      position: editing?.position ?? 0,
      org: c.org ?? "",
      role: c.role ?? "",
      start: c.start ?? "",
      end: c.end ?? "",
      bullets: (c.bullets ?? []).join("\n"),
      skills: (c.skills ?? []).join(", "),
    }
  }, [editing])

  const [form, setForm] = useState(initial)

  useEffect(() => setForm(initial), [initial])

  const submit = async () => {
    const bullets = form.bullets
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)

    const skills = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)

    const content: WorkContent = {
      org: form.org || undefined,
      role: form.role || undefined,
      start: form.start || undefined,
      end: form.end ? form.end : null,
      bullets,
      skills,
    }

    await onSubmit({
      title: form.title || form.org || "",
      position: Number.isFinite(Number(form.position)) ? Number(form.position) : 0,
      content,
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">{editing ? "Edit Career Item" : "Add New Career Item"}</h3>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Company *</label>
            <input
              type="text"
              value={form.org}
              onChange={(e) => setForm((p) => ({ ...p, org: e.target.value }))}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
              placeholder="Google, Microsoft, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Position *</label>
            <input
              type="text"
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
              placeholder="Software Engineer, Product Manager, etc."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Start Date *</label>
            <input
              type="date"
              value={form.start}
              onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">End Date</label>
            <input
              type="date"
              value={form.end}
              onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Bullets *</label>
          <textarea
            value={form.bullets}
            onChange={(e) => setForm((p) => ({ ...p, bullets: e.target.value }))}
            rows={4}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
            placeholder={"One bullet per line\nBuilt X\nImproved Y"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-2">Skills</label>
          <input
            type="text"
            value={form.skills}
            onChange={(e) => setForm((p) => ({ ...p, skills: e.target.value }))}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900"
            placeholder="JavaScript, React, Node.js"
          />
          <p className="text-gray-500 text-xs mt-1">Separate skills with commas</p>
        </div>

        <div className="flex gap-3 pt-4">
          <button onClick={submit} disabled={saving} className="btn-primary">
            {editing ? "Update Item" : "Add Item"}
          </button>
          <button onClick={onCancel} disabled={saving} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
