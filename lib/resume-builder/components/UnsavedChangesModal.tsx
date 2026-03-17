"use client"

type UnsavedChangesModalProps = {
  open: boolean
  onStay: () => void
  onDiscard: () => void
}

export function UnsavedChangesModal({ open, onStay, onDiscard }: UnsavedChangesModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: "420px" }}>
        <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--ink)" }}>
          Unapplied changes
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--ink-fade)" }}>
          You have unapplied changes. Stay to keep editing, or discard to continue.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onStay}>
            Stay
          </button>
          <button type="button" className="card-action-delete-negative" onClick={onDiscard}>
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}
