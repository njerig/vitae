"use client"

import { useState } from "react"
import { SaveResumeModal } from "./SaveResumeModal"
import toast from "react-hot-toast"

type WorkingState = {
  sections: {
    item_type_id: string
    item_ids: string[]
  }[]
}

type SaveResumeButtonProps = {
  workingState: WorkingState
}

export function SaveResumeButton({ workingState }: SaveResumeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Check if working state is empty
  const hasSelectedItems = 
    workingState.sections.length > 0 && 
    workingState.sections.some(section => section.item_ids.length > 0)

  const handleSave = async (name: string) => {
    setSaving(true)
    try {
      const response = await fetch("/api/versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        throw new Error("Failed to save resume version")
      }

      toast.success(`Resume "${name}" saved successfully!`)
      setIsModalOpen(false)
    } catch (error) {
      console.error("Error saving resume:", error)
      toast.error("Failed to save resume. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary flex items-center gap-2"
        disabled={!hasSelectedItems}
        title={!hasSelectedItems ? "Select items to save a resume version" : "Save current selection as a resume version"}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Save Resume
      </button>

      {isModalOpen && (
        <SaveResumeModal
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
          saving={saving}
        />
      )}
    </>
  )
}
