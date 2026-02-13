"use client"

import { useEffect } from "react"
import { Spinner } from "@/lib/components/Spinner"

type DeleteItemModalProps = {
  itemTitle: string
  itemType: string
  onConfirm: () => void
  onCancel: () => void
  deleting?: boolean
}

export function DeleteItemModal({
  itemTitle,
  itemType,
  onConfirm,
  onCancel,
  deleting = false
}: DeleteItemModalProps) {
  // Disable body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) {
        onCancel()
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [onCancel, deleting])

  return (
    <div
      className="modal-overlay"
      onClick={!deleting ? onCancel : undefined}
      style={{
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-semibold mb-4" style={{ 
          color: "var(--ink)",
          fontFamily: "var(--font-serif)"
        }}>
          Delete Item?
        </h3>
        
        <p className="mb-2 leading-relaxed" style={{ color: "var(--ink-fade)" }}>
          This will permanently delete your <strong>{itemType}</strong>:
        </p>
        
        <p className="mb-6 font-medium leading-relaxed" style={{ color: "var(--ink)" }}>
          "{itemTitle}"
        </p>
        
        <p className="text-sm mb-6" style={{ color: "var(--ink-fade)" }}>
          This action cannot be undone.
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="btn-secondary"
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="btn-primary"
          >
            {deleting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Spinner size={16} color="white" inline />
                Deleting...
              </span>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}