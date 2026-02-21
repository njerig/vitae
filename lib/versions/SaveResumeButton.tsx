"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  parentVersionId?: string | null
  syncToBackend: () => Promise<void>
}

export function SaveResumeButton({ workingState, parentVersionId, syncToBackend }: SaveResumeButtonProps) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasSelectedItems =
    workingState.sections.length > 0 &&
    workingState.sections.some(section => section.item_ids.length > 0)

  const handleOpenModal = async () => {
    // Flush any pending local changes to the backend before opening the save dialog
    await syncToBackend()
    setIsModalOpen(true)
  }

  const handleSave = async (
    groupName: string,
    versionNote: string,
    selectedParentVersionId: string | null,
  ): Promise<{ success: boolean; error?: string }> => {
    setSaving(true)
    try {
      const response = await fetch("/api/versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          group_name: selectedParentVersionId ? undefined : groupName,
          name: versionNote,
          parent_version_id: selectedParentVersionId,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const errorMessage = data.error || "Failed to save resume version"

        if (response.status === 409) {
          return { success: false, error: errorMessage }
        }

        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }

      toast.success(`Resume "${groupName}" saved successfully!`)
      setIsModalOpen(false)
      const savedAt = new Date().toISOString()
      router.push(`/resume?version=${encodeURIComponent(groupName)}&savedAt=${encodeURIComponent(savedAt)}`)
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
        onClick={handleOpenModal}
        className="btn-primary rounded-md px-2 py-1 text-sm flex items-center gap-1"
        disabled={!hasSelectedItems}
        title={!hasSelectedItems ? "Select items to save a resume version" : "Save current selection as a resume version"}
      >
        <Save className="w-6 h-6" />
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