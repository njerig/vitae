"use client"

import { useState, FormEvent, useEffect } from "react"
import { ResumeNameSchema } from "@/lib/schemas"

type SaveResumeModalProps = {
  onSave: (name: string) => Promise<void>
  onClose: () => void
  saving: boolean
}

export function SaveResumeModal({ onSave, onClose, saving }: SaveResumeModalProps) {
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Disable body scroll when modal is open
  useEffect(() => {
    // Store original overflow value
    const originalOverflow = document.body.style.overflow
    
    // Disable scrolling
    document.body.style.overflow = 'hidden'
    
    // Re-enable scrolling when modal closes
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate using Zod schema
    const result = ResumeNameSchema.safeParse({ name })
    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    try {
      await onSave(name)
      // Modal will be closed by parent component on success
    } catch (err) {
      // Error handling is done by parent component via toast
      console.error("Save failed:", err)
    }
  }

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-semibold mb-4" style={{ color: "var(--ink)" }}>
          Save Resume Version
        </h3>
        <p className="text-sm mb-6" style={{ color: "var(--ink-fade)" }}>
          Give this version of your resume a name to save it for later.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="resume-name"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--ink)" }}
            >
              Resume Name
            </label>
            <input
              id="resume-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Software Engineer - FAANG"
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: error ? "#dc2626" : "var(--grid)",
                borderRadius: "var(--radius-soft)",
                fontFamily: "var(--font-sans)",
              }}
              disabled={saving}
              autoFocus
            />
            {error && (
              <p className="text-sm mt-1" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
