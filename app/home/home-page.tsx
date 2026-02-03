"use client"
import { useCanonWork } from "@/lib/canon/useCanonWork"
import { CanonForm } from "@/lib/canon/components/CanonForm"
import { CanonItem, WorkContent } from "@/lib/types"
import { useState } from "react"
import { CanonList } from "@/lib/canon/components/CanonList"

export default function HomeClient({ userName, userId }: { userName: string; userId: string }) {
  const { items, stats, loading, saving, error, createWork, patchWork, removeWork } = useCanonWork()

  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<CanonItem<WorkContent> | null>(null)

  const startAdd = () => {
    setEditingItem(null)
    setIsAddingItem(true)
  }

  const startEdit = (item: CanonItem<WorkContent>) => {
    setEditingItem(item)
    setIsAddingItem(true)
  }

  const cancel = () => {
    setIsAddingItem(false)
    setEditingItem(null)
  }

  const submit = async (payload: { title: string; position: number; content: WorkContent }) => {
    try {
      if (editingItem) {
        await patchWork(editingItem.id, payload)
      } else {
        await createWork(payload)
      }
      cancel() // Only close form on success
    } catch {
      // Error is already set in the hook state, keep form open
    }
  }

  const del = async (id: string) => {
    if (confirm("Delete this career item?")) {
      await removeWork(id)
    }
  }

  return (
    <div className="page-container">
      <div className="page-bg-gradient"></div>
      <div className="page-accent-light"></div>

      <div className="relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">My Career History</h2>
                <p className="text-lg text-gray-600">Add, edit, and manage your career history.</p>
              </div>
              <button onClick={startAdd} className="btn-primary flex items-center gap-2" disabled={saving}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-semibold text-gray-900 mb-1">{stats.total}</div>
                <p className="text-gray-600 text-sm">Total Items</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-semibold text-gray-900 mb-1">{stats.totalSkills}</div>
                <p className="text-gray-600 text-sm">Total Skills</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-3xl font-semibold text-gray-900 mb-1">{stats.uniqueSkills}</div>
                <p className="text-gray-600 text-sm">Unique Skills</p>
              </div>
            </div>
          </div>

          {isAddingItem && <CanonForm editing={editingItem} onCancel={cancel} onSubmit={submit} saving={saving} error={error} />}

          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">Career History ({loading ? "…" : items.length})</h3>
            </div>

            <CanonList items={items} onEdit={startEdit} onDelete={del} />
          </div>
        </div>
      </div>
    </div>
  )
}
