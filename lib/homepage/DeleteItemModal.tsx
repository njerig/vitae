"use client"

import { useEffect } from "react"
import { Spinner } from "@/lib/components/Spinner"

type DeleteItemModalProps = {
  itemTitle: string
  onConfirm: () => Promise<void>
  onClose: () => void
  deleting: boolean
}

export function DeleteItemModal({ itemTitle, onConfirm, onClose, deleting }: DeleteItemModalProps) {
  // Disable body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    await onConfirm()
  }

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-semibold mb-4" style={{ color: "var(--ink)" }}>
          Delete Item
        </h3>
        <p className="text-sm mb-2" style={{ color: "var(--ink-fade)" }}>
          Are you sure you want to delete this item? This action cannot be undone.
        </p>
        <p
          className="text-sm font-medium mb-6 px-3 py-2 rounded-lg"
          style={{
            color: "var(--ink)",
            backgroundColor: "var(--paper-dark)",
            borderColor: "var(--grid)",
            border: "1px solid var(--grid)",
          }}
        >
          {itemTitle}
        </p>

        <form onSubmit={handleConfirm}>
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={deleting}
            >
              {deleting ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Spinner size={16} color="white" inline />
                  Deleting...
                </span>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}