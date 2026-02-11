"use client"

type Version = {
  id: string
  name: string
  created_at: string
}

interface VersionCardProps {
  version: Version
  onDelete: (id: string, name: string) => void
  isDeleting: boolean
}

export function VersionCard({ version, onDelete, isDeleting }: VersionCardProps) {
  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="card">
      <div className="flex flex-col gap-3">
        <div className="flex-1">
          <h2 className="card-title mb-2">{version.name}</h2>
          <p className="card-text">
            Created: {formatDate(version.created_at)}
          </p>
        </div>
        <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--grid)" }}>
          <button
            onClick={() => onDelete(version.id, version.name)}
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
