"use client"

import { useState } from "react"
import { SaveResumeModal } from "./SaveResumeModal"
import toast from "react-hot-toast"
import { Save } from "lucide-react"
import { saveVersion } from "../../api"

type WorkingState = {
  sections: {
    item_type_id: string
    item_ids: string[]
  }[]
}

type SaveResumeButtonProps = {
  workingState: WorkingState
  parentVersionId?: string | null
  syncToBackend: () => Promise<void>
}

export function SaveResumeButton({
  workingState,
  parentVersionId,
  syncToBackend,
}: SaveResumeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasSelectedItems =
    workingState.sections.length > 0 &&
    workingState.sections.some((section) => section.item_ids.length > 0)

  const handleOpenModal = async () => {
    // Flush any pending local changes to the backend before opening the save dialog
    await syncToBackend()
    setIsModalOpen(true)
  }

  // Handles the save by calling the API
  const handleSave = async (
    groupName: string,
    versionNote: string,
    selectedParentVersionId: string | null
  ): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    try {
      await saveVersion(groupName, versionNote, selectedParentVersionId)
      return { success: true }
    } catch (error) {
      toast.error("Failed to save resume. Please try again.")
      console.error("Error saving resume:", error)
      return { success: false, error: "Failed to save resume. Please try again." }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="btn-primary rounded-lg flex items-center gap-1.5"
        style={{ padding: "0.8rem", fontSize: "0.8rem" }}
        disabled={!hasSelectedItems}
        title={
          !hasSelectedItems
            ? "Select items to save a resume version"
            : "Save current selection as a resume version"
        }
      >
        <Save className="w-3.5 h-3.5" />
        Save Resume
      </button>

      {isModalOpen && (
        <SaveResumeModal
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
          saving={saving}
          defaultParentVersionId={parentVersionId}
        />
      )}
    </>
  )
}
