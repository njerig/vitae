"use client"

import { useCanon } from "@/lib/canon/useCanon"
import { CanonForm } from "@/lib/canon/components/CanonForm"
import { CanonList } from "@/lib/canon/components/CanonList"
import { Timeline } from "@/lib/homepage/Timeline"
import type { CanonItem } from "@/lib/types"
import { useEffect, useRef, useState } from "react"

export default function HomeClient({ userName, userId }: { userName: string; userId: string }) {
  const { items, itemTypes, selectedTypeId, setSelectedTypeId, stats, loading, saving, error, setError, create, patch, remove } = useCanon()

  // Form state
  const [isAddingItem, setIsAddingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<CanonItem<unknown> | null>(null)

  // Get most recent edit timestamp from all items
  const getLastEditedDate = () => {
    if (items.length === 0) return null
    
    const mostRecent = items.reduce((latest, item) => {
      const itemDate = new Date(item.updated_at)
      return itemDate > new Date(latest.updated_at) ? item : latest
    })

    return new Date(mostRecent.updated_at).toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric", 
      year: "numeric" 
    })
  }

  // Ref for scrolling to form
  const formRef = useRef<HTMLDivElement>(null)

  const startAdd = () => {
    setEditingItem(null)
    setError(null)
    setIsAddingItem(true)
  }

  const startEdit = (item: CanonItem<unknown>) => {
    setEditingItem(item)
    setError(null)
    setIsAddingItem(true)
  }

  const cancel = () => {
    setIsAddingItem(false)
    setEditingItem(null)
    setError(null)
  }

  const submit = async (payload: { item_type_id: string; title: string; position: number; content: Record<string, unknown> }) => {
    try {
      if (editingItem) {
        await patch(editingItem.id, {
          title: payload.title,
          position: payload.position,
          content: payload.content,
        })
      } else {
        await create(payload)
      }
      cancel()
    } catch {
      // Error is already set in the hook, keep form open
    }
  }

  const del = async (id: string) => {
    if (confirm("Delete this item?")) {
      await remove(id)
    }
  }

  // Auto-scroll to form when it opens
  useEffect(() => {
    if (isAddingItem && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [isAddingItem])

  return (
    <div className="page-container">
      <div className="page-bg-gradient"></div>
      <div className="page-accent-light"></div>

      <div className="relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">My Career History</h2>
                <p className="text-lg text-gray-600">Add, edit, and manage your career items.</p>
              </div>
              <button onClick={startAdd} className="btn-primary flex items-center gap-2" disabled={saving || loading || itemTypes.length === 0}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            {/* Summary */}
            <div className="pt-4 border-t" style={{ borderColor: "var(--grid)" }}>
              <Timeline items={items} itemTypes={itemTypes} />
              {getLastEditedDate() && (
                <p className="text-xs text-right" style={{ color: "var(--ink)", opacity: 0.4 }}>
                  Last edited: {getLastEditedDate()}
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          {isAddingItem && (
            <div ref={formRef}>
              <CanonForm
                itemTypes={itemTypes}
                editing={editingItem}
                defaultTypeId={selectedTypeId ?? undefined}
                onCancel={cancel}
                onSubmit={submit}
                saving={saving}
                error={error}
              />
            </div>
          )}

          {/* Item List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setSelectedTypeId(null)}
                className={`tab-button ${selectedTypeId === null ? "tab-button-active" : ""}`}
              >
                All ({items.length})
              </button>
              {itemTypes.map((t) => {
                const count = stats.byType.find((s) => s.id === t.id)?.count ?? 0
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTypeId(t.id)}
                    className={`tab-button ${selectedTypeId === t.id ? "tab-button-active" : ""}`}
                  >
                    {t.display_name} ({count})
                  </button>
                )
              })}
            </div>

            {/* List header */}
            <div className="mb-6">
              <h3>
                {selectedTypeId ? itemTypes.find((t) => t.id === selectedTypeId)?.display_name : "All Items"} ({loading ? "…" : items.length})
              </h3>
            </div>

            <CanonList items={items} itemTypes={itemTypes} onEdit={startEdit} onDelete={del} />
          </div>
        </div>
      </div>
    </div>
  )
}
