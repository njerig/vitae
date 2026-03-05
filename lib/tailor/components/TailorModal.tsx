"use client"

import { useState, useEffect } from "react"
import { Spinner } from "@/lib/shared/components/Spinner"

type TailorModalProps = {
  onTailor: (jobDescription: string) => Promise<void>
  onClose: () => void
  tailoring: boolean
}

export function TailorModal({ onTailor, onClose, tailoring }: TailorModalProps) {
  const [jobDescription, setJobDescription] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Disable body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  const handleSubmit = async () => {
    setError(null)

    if (!jobDescription.trim()) {
      setError("Please paste a job description")
      return
    }

    try {
      await onTailor(jobDescription.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tailoring failed")
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/*Modal Header*/}
        <h3 className="text-2xl font-semibold mb-2" style={{ color: "var(--ink)" }}>
          Tailor Resume
        </h3>
        <p className="text-sm mb-6" style={{ color: "var(--ink-fade)" }}>
          Paste a job description and we&apos;ll use AI to reorder and select the most relevant
          items from your career history.
        </p>

        {/*Job Description Textarea*/}
        <div className="mb-4">
          <label
            htmlFor="job-description"
            className="block text-sm font-medium mb-2"
            style={{ color: "var(--ink)" }}
          >
            Job Description
          </label>
          <textarea
            id="job-description"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full px-3 py-2 border rounded resize-y"
            style={{
              borderColor: error ? "#dc2626" : "var(--grid)",
              borderRadius: "var(--radius-soft)",
              fontFamily: "var(--font-sans)",
              minHeight: "160px",
              maxHeight: "320px",
              fontSize: "0.875rem",
              lineHeight: "1.6",
            }}
            disabled={tailoring}
            autoFocus
          />
        </div>

        {/*Error Message*/}
        {error && (
          <p className="text-sm mb-4" style={{ color: "#dc2626" }}>
            {error}
          </p>
        )}

        {/*Action Buttons*/}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary" disabled={tailoring}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary"
            disabled={tailoring || !jobDescription.trim()}
          >
            {tailoring ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Spinner size={16} color="white" inline />
                Tailoring...
              </span>
            ) : (
              "Tailor Resume"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
