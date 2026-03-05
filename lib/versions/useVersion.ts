import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { VersionGroup } from "../shared/types"
import { deleteVersion, fetchVersion, restoreVersion } from "./api"

export function useVersion() {
  const router = useRouter()
  const [groups, setGroups] = useState<VersionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<{ id: string; name: string } | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [showTreeGroups, setShowTreeGroups] = useState<Set<string>>(new Set())

  // Toggles the visibility of a version group in the tree view
  const toggleTreeGroup = (groupId: string) => {
    setShowTreeGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  // Retrieves versions from database
  const fetchVersions = async () => {
    setLoading(true)
    try {
      const data = await fetchVersion()
      setGroups(data)
      // Expand all groups by default
      setExpandedGroups(new Set(data.map((g) => g.resume_group_id)))
    } catch (error) {
      toast.error("Failed to load saved resumes")
      console.error("Error fetching versions:", error)
    } finally {
      setLoading(false)
    }
  }

  // Toggles the visibility of a version group in a list view
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  // Deletes a version
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(id)
    try {
      await deleteVersion(id)
      // Remove version from its group, and remove empty groups
      setGroups((prevGroups) =>
        prevGroups
          .map((group) => ({
            ...group,
            versions: group.versions.filter((v) => v.id !== id),
          }))
          .filter((group) => group.versions.length > 0)
      )
      toast.success(`"${name}" deleted successfully`)
    } catch (error) {
      console.error("Error deleting version:", error)
      toast.error("Failed to delete resume")
    } finally {
      setDeleting(null)
    }
  }

  // Opens a confirmation dialog to restore a version
  const handleRestoreClick = (id: string, name: string) => {
    setConfirmRestore({ id, name })
  }

  // Restores a version
  const handleRestoreConfirm = async () => {
    if (!confirmRestore) return

    const { id, name } = confirmRestore
    setConfirmRestore(null)
    setRestoring(id)

    try {
      const response = await restoreVersion(id)

      const data = response
      const savedAt = new Date().toISOString()
      // Pass the version_id and resume_group_id so that subsequent saves link to this group
      router.push(
        `/resume?version=${encodeURIComponent(name)}&savedAt=${encodeURIComponent(savedAt)}&parentVersionId=${encodeURIComponent(data.version_id)}`
      )
      toast.success(`"${name}" restored successfully`)
    } catch (error) {
      console.error("Error restoring version:", error)
      toast.error("Failed to restore version")
      setRestoring(null)
    }
  }

  return {
    groups,
    setGroups,
    loading,
    setLoading,
    deleting,
    setDeleting,
    restoring,
    setRestoring,
    confirmRestore,
    setConfirmRestore,
    expandedGroups,
    setExpandedGroups,
    fetchVersions,
    toggleGroup,
    handleDelete,
    handleRestoreClick,
    handleRestoreConfirm,
    showTreeGroups,
    toggleTreeGroup,
  }
}
