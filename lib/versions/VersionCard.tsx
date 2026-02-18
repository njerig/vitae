"use client"

import { formatDateTime } from "@/lib/utils"

type Version = {
  id: string
  group_name: string
  name: string
  created_at: string
}

interface VersionCardProps {
  version: Version
  onDelete: (id: string, name: string) => void
  isDeleting: boolean
  onRestore: (id: string, name: string) => void
  isRestoring: boolean
}

export function VersionCard({ version, onDelete, isDeleting, onRestore, isRestoring }: VersionCardProps) {
  const displayName = version.group_name || version.name || "Untitled"
  return (
    <div className="card">
      <div className="flex flex-col gap-3">
        <div className="flex-1">
          <p className="card-text mb-1" style={{ fontSize: "0.8rem" }}>
            {formatDateTime(version.created_at)}
          </p>
          {version.name && (
            <p className="card-text" style={{ color: "var(--ink-light)", fontStyle: "italic" }}>
              {version.name}
            </p>
          )}
        </div>
        <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--grid)" }}>
          <button
            onClick={() => onRestore(version.id, displayName)}
            disabled={isRestoring}
            className="card-action-edit flex-1"
          >
            {isRestoring ? "Restoring..." : "Restore"}
          </button>
          <button
            onClick={() => onDelete(version.id, displayName)}
            disabled={isDeleting}
            className="card-action-delete flex-1"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}
