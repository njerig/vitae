import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"
import { VersionGroup } from "../types"
import { deleteVersion, fetchVersion, restoreVersion } from "./api"

export function useVersion() {
    const router = useRouter()
    const [groups, setGroups] = useState<VersionGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [restoring, setRestoring] = useState<string | null>(null)
    const [confirmRestore, setConfirmRestore] = useState<{ id: string; name: string } | null>(null)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  
    const fetchVersions = async () => {
    setLoading(true)
    try {
      const data = await fetchVersion()
      setGroups(data)
      // Expand all groups by default
      setExpandedGroups(new Set(data.map(g => g.resume_group_id)))
    } catch (error) {
      toast.error("Error fetching versions")
      console.error("Error fetching versions:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(id)
    try {
      const response = await deleteVersion(id)
      // Remove version from its group, and remove empty groups
      setGroups(prevGroups =>
        prevGroups
          .map(group => ({
            ...group,
            versions: group.versions.filter(v => v.id !== id),
          }))
          .filter(group => group.versions.length > 0)
      )
      toast.success(`"${name}" deleted successfully`)
    } catch (error) {
      console.error("Error deleting version:", error)
      toast.error("Failed to delete resume")
    } finally {
      setDeleting(null)
    }
  }

  const handleRestoreClick = (id: string, name: string) => {
    setConfirmRestore({ id, name })
  }

  const handleRestoreConfirm = async () => {
    if (!confirmRestore) return

    const { id, name } = confirmRestore
    setConfirmRestore(null)
    setRestoring(id)

    try {
      const response = await restoreVersion(id);

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
    handleRestoreConfirm
  }
}