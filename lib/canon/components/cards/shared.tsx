// Shared types and utilities for canon cards
import type { CanonItem } from "@/lib/types"

export type CardProps = {
  item: CanonItem<unknown>
  onEdit: () => void
  onDelete: () => void
}

// Format date from YYYY-MM-DD to MM-DD-YYYY
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ""
  const [year, month, day] = dateStr.split("-")
  return `${month}-${day}-${year}`
}

// Action buttons component
export function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-2 shrink-0">
      <button onClick={onEdit} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-medium transition-colors">
        Edit
      </button>
      <button onClick={onDelete} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors">
        Delete
      </button>
    </div>
  )
}
