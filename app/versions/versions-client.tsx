"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/lib/components/PageHeader"
import { Spinner } from "@/lib/components/Spinner"
import { VersionCard } from "@/lib/versions/VersionCard"
import { RestoreConfirmModal } from "@/lib/versions/RestoreConfirmModal"
import toast from "react-hot-toast"
import { ChevronRight } from "lucide-react"

type Version = {
  id: string
  user_id: string
  name: string
  snapshot: Record<string, unknown>
  created_at: string
}

interface VersionsClientProps {
  userName: string
  userId: string
}

export default function VersionsClient({ userName }: VersionsClientProps) {
  const router = useRouter()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    fetchVersions()
  }, [])

  const fetchVersions = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/versions")
      if (!response.ok) {
        throw new Error("Failed to fetch versions")
      }
      const data = await response.json()
      setVersions(data)
    } catch (error) {
      console.error("Error fetching versions:", error)
      toast.error("Failed to load saved resumes")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This action cannot be undone.`)) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/versions?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete version")
      }

      setVersions(versions.filter(v => v.id !== id))
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
      const response = await fetch(`/api/versions/${id}/restore`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to restore version")
      }

      toast.success(`"${name}" restored successfully`)
      router.push(`/resume?version=${encodeURIComponent(name)}`)
    } catch (error) {
      console.error("Error restoring version:", error)
      toast.error("Failed to restore version")
      setRestoring(null)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-bg-gradient"></div>
        <div className="relative z-10 pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Spinner size={40} />
              <p style={{ color: "var(--ink-light)" }}>Loading your saved resumes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-bg-gradient"></div>
      <div className="page-accent-light"></div>

      <div className="relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
            <PageHeader
              title="Version History"
              subtitle="Manage your saved resume versions"
              actions={
                <Link href="/resume">
                  <button className="btn-secondary rounded-lg flex items-center gap-2">
                    Resume Builder
                    <ChevronRight className="h-4 w-4"/>
                  </button>
                </Link>
              }
            />
          </div>

          {/* Empty State */}
          {versions.length === 0 ? (
            <div className="bg-white rounded-2xl border p-12 text-center shadow-sm" style={{ borderColor: "var(--grid)" }}>
              <p style={{ color: "var(--ink-fade)", fontSize: "1.125rem", marginBottom: "1rem" }}>
                No saved resumes yet. Create one from the Resume Builder!
              </p>
              <Link href="/resume">
                <button className="btn-primary">
                  Go to Resume Builder
                </button>
              </Link>
            </div>
          ) : (
            /* Versions List */
            <div className="flex flex-col gap-3 max-w-2xl mx-auto">
              {versions.map((version) => (
                <VersionCard
                  key={version.id}
                  version={version}
                  onDelete={handleDelete}
                  isDeleting={deleting === version.id}
                  onRestore={handleRestoreClick}
                  isRestoring={restoring === version.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <RestoreConfirmModal
        isOpen={confirmRestore !== null}
        onClose={() => setConfirmRestore(null)}
        onConfirm={handleRestoreConfirm}
        versionName={confirmRestore?.name ?? ""}
      />
    </div>
  )
}
