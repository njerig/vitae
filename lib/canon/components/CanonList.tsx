"use client"

import type { CanonItem, WorkContent } from "@/lib/types"

export function CanonList({
  items,
  onEdit,
  onDelete,
}: {
  items: CanonItem<WorkContent>[]

  // These functions allow us to edit and delete items by passing it from this list component to the parent component
  onEdit: (item: CanonItem<WorkContent>) => void
  onDelete: (id: string) => void | Promise<void>
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-600 mb-4 text-lg">No career items yet</div>
      </div>
    )
  }

  // Format date from YYYY-MM-DD to MM-DD-YYYY
  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return ""
    const [year, month, day] = dateStr.split("-")
    return `${month}-${day}-${year}`
  }

  return (
    <div className="space-y-4">
      {/* For each canon item, display all possible fields if not empty*/}
      {items.map((item) => {
        const c = item.content ?? {}
        return (
          <div key={item.id} className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-gray-900 font-semibold text-xl">{c.role ?? ""}</h4>
                <p className="text-blue-600 font-medium">{c.org ?? ""}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {formatDate(c.start)} → {c.end ? formatDate(c.end) : "Present"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(item)}
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(item.id)}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Displaying bullet points if there are any */}
            {(c.bullets?.length ?? 0) > 0 && (
              <ul className="text-gray-700 mb-3 list-disc pl-5 space-y-1">
                {(c.bullets ?? []).map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}

            {/* Displaying skills if there are any */}
            {(c.skills?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2">
                {(c.skills ?? []).map((skill, i) => (
                  <span key={i} className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
