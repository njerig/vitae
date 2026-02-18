"use client"

import { useState, FormEvent, useEffect } from "react"
import { Spinner } from "@/lib/components/Spinner"
import type { VersionGroup } from "@/lib/types"

type SaveResumeModalProps = {
  onSave: (
    groupName: string,
    versionNote: string,
    parentVersionId: string | null,
  ) => Promise<{ success: boolean; error?: string }>
  onClose: () => void
  saving: boolean
  defaultParentVersionId?: string | null
}

export function SaveResumeModal({ onSave, onClose, saving, defaultParentVersionId }: SaveResumeModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [groups, setGroups] = useState<VersionGroup[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string>("new")
  const [resumeName, setResumeName] = useState("")
  const [versionNote, setVersionNote] = useState("")

  const isNewResume = selectedGroupId === "new"

  // Disable body scroll when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Fetch existing version groups
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch("/api/versions")
        if (response.ok) {
          const data: VersionGroup[] = await response.json()
          setGroups(data)

          // If a default parent version ID was provided, pre-select that group
          if (defaultParentVersionId) {
            const matchingGroup = data.find(g =>
              g.versions.some(v => v.id === defaultParentVersionId)
            )
            if (matchingGroup) {
              setSelectedGroupId(matchingGroup.resume_group_id)
            }
          }
        }
      } catch {
        // Silently fail — user can still save as new
      } finally {
        setLoadingGroups(false)
      }
    }
    fetchGroups()
  }, [defaultParentVersionId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (isNewResume && !resumeName.trim()) {
      setError("Resume name is required")
      return
    }

    let parentVersionId: string | null = null
    let groupName = resumeName.trim()

    if (!isNewResume) {
      const group = groups.find(g => g.resume_group_id === selectedGroupId)
      if (group) {
        groupName = group.group_name
        if (group.versions.length > 0) {
          parentVersionId = group.versions[0].id
        }
      }
    }

    const saveResult = await onSave(groupName, versionNote.trim(), parentVersionId)
    if (!saveResult.success && saveResult.error) {
      setError(saveResult.error)
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
          {isNewResume
            ? "Create a new resume and save the current state as its first version."
            : "Save the current state as a new version of an existing resume."
          }
        </p>

        <form onSubmit={handleSubmit}>
          {/* Version Group Selector */}
          <div className="mb-4">
            <label
              htmlFor="version-group"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--ink)" }}
            >
              Save To
            </label>
            {loadingGroups ? (
              <div className="flex items-center gap-2 py-2">
                <Spinner size={14} inline />
                <span className="text-sm" style={{ color: "var(--ink-fade)" }}>Loading groups...</span>
              </div>
            ) : (
              <select
                id="version-group"
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                style={{
                  borderColor: "var(--grid)",
                  borderRadius: "var(--radius-soft)",
                  fontFamily: "var(--font-sans)",
                  backgroundColor: "white",
                }}
                disabled={saving}
              >
                <option value="new">New Resume</option>
                {groups.map((group) => (
                  <option key={group.resume_group_id} value={group.resume_group_id}>
                    {group.group_name} ({group.versions.length} version{group.versions.length !== 1 ? "s" : ""})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Resume Name — only shown for new resumes */}
          {isNewResume && (
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
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
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
            </div>
          )}

          {/* Version Note — optional commit message */}
          <div className="mb-4">
            <label
              htmlFor="version-note"
              className="block text-sm font-medium mb-2"
              style={{ color: "var(--ink)" }}
            >
              Version Note <span className="font-normal" style={{ color: "var(--ink-fade)" }}>(optional)</span>
            </label>
            <input
              id="version-note"
              type="text"
              value={versionNote}
              onChange={(e) => setVersionNote(e.target.value)}
              placeholder={isNewResume ? "e.g., Initial draft" : "e.g., Updated skills section"}
              className="w-full px-3 py-2 border rounded"
              style={{
                borderColor: "var(--grid)",
                borderRadius: "var(--radius-soft)",
                fontFamily: "var(--font-sans)",
              }}
              disabled={saving}
              autoFocus={!isNewResume}
            />
          </div>

          {error && (
            <p className="text-sm mb-4" style={{ color: "#dc2626" }}>
              {error}
            </p>
          )}

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
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Spinner size={16} color="white" inline />
                  Saving...
                </span>
              ) : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
