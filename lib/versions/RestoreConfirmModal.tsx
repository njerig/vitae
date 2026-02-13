"use client"

interface RestoreConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  versionName: string
}

export function RestoreConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  versionName
}: RestoreConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-serif text-2xl mb-4 text-(--ink)">
          Restore Version?
        </h3>
        <p className="text-(--ink-fade) mb-6 leading-relaxed">
          This will replace your current draft with <strong>"{versionName}"</strong>. This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} className="btn-primary">
            Restore
          </button>
        </div>
      </div>
    </div>
  )
}
