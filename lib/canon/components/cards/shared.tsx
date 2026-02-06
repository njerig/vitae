// Shared types and utilities for canon cards
import type { ReactNode } from "react"
import type { CanonItem } from "@/lib/types"

export type CardProps = {
  item: CanonItem<unknown>
  onEdit: () => void
  onDelete: () => void
  selected?: boolean
  onToggle?: () => void
}

// Format date from YYYY-MM-DD to MM-DD-YYYY
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return ""
  const [year, month, day] = dateStr.split("-")
  return `${month}-${day}-${year}`
}

export function getBullets(content: Record<string, unknown>): string[] {
  const raw = content.bullets

  if (Array.isArray(raw)) {
    return raw.map((bullet) => String(bullet).trim()).filter(Boolean)
  }

  if (typeof raw === "string") {
    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  }

  return []
}

export function renderBulletList(bullets: string[]): ReactNode {
  if (bullets.length === 0) return undefined

  return (
    <ul className="card-text mt-2 list-disc pl-4 space-y-0.5">
      {bullets.map((bullet, index) => (
        <li key={`${index}-${bullet}`}>{bullet}</li>
      ))}
    </ul>
  )
}

// Action buttons component
export function CardActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex gap-2 shrink-0">
      <button onClick={onEdit} className="card-action-edit">
        Edit
      </button>
      <button onClick={onDelete} className="card-action-delete">
        Delete
      </button>
    </div>
  )
}
