"use client"
import { useState } from "react"
import { SaveResumeModal } from "./SaveResumeModal"
import toast from "react-hot-toast"
import { Save } from "lucide-react"

type WorkingState = {
  sections: {
    item_type_id: string
    item_ids: string[]
  }[]
}

type SaveResumeButtonProps = {
  workingState: WorkingState
  onBeforeSave?: () => Promise<void>  
  hasUnsavedChanges?: boolean         
}

export function SaveResumeButton({ 
  workingState, 
  onBeforeSave,
  hasUnsavedChanges = false 
}: SaveResumeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Check if working state is empty
  const hasSelectedItems = 
    workingState.sections.length > 0 && 
    workingState.sections.some(section => section.item_ids.length > 0)

  const handleSave = async (name: string): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    try {
      if (onBeforeSave) {
        await onBeforeSave()
      }

      const response = await fetch("/api/versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        // Extract error message from API response
        const data = await response.json().catch(() => ({}))
        const errorMessage = data.error || "Failed to save resume version"
        
        // For duplicate name errors (409), return the error to be shown in modal
        if (response.status === 409) {
          return { success: false, error: errorMessage }
        }
        
        // For other errors, show toast and return error
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }

      toast.success(`Resume "${name}" saved successfully!`)
      setIsModalOpen(false)
      return { success: true }
    } catch (error) {
      console.error("Error saving resume:", error)
      const errorMessage = "Failed to save resume. Please try again."
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="btn-primary rounded-md px-2 py-1 text-sm flex items-center gap-1 transition-all"
        disabled={!hasSelectedItems}
        title={!hasSelectedItems ? "Select items to save a resume version" : "Save current selection as a resume version"}
        style={{
          opacity: hasUnsavedChanges ? 1 : 0.9,
          boxShadow: hasUnsavedChanges ? '0 0 0 2px rgba(139, 69, 19, 0.2)' : 'none'
        }}
      >
        <Save className="w-6 h-6" />
        Save Resume
        {hasUnsavedChanges && (
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        )}
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