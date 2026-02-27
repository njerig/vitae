"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/lib/components/PageHeader"
import { Spinner } from "@/lib/components/Spinner"
import { VersionCard } from "@/lib/versions/VersionCard"
import { RestoreConfirmModal } from "@/lib/versions/RestoreConfirmModal"
import toast from "react-hot-toast"
import { ChevronRight, ChevronDown } from "lucide-react"
import type { Version, VersionGroup } from "@/lib/types"
import { fetchVersion } from "@/lib/versions/api"
import { useVersion } from "@/lib/versions/useVersion"

interface VersionsClientProps {
  userName: string
  userId: string
}

export default function VersionsClient({ userName }: VersionsClientProps) {
  const {groups,
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
    handleRestoreConfirm } = useVersion();
  
  useEffect(() => {
    fetchVersions()
  }, [])

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
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </Link>
              }
            />
          </div>

          {/* Empty State */}
          {groups.length === 0 ? (
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
            /* Grouped Versions List */
            <div className="flex flex-col gap-4 max-w-2xl mx-auto">
              {groups.map((group) => (
                <div
                  key={group.resume_group_id}
                  className="bg-white rounded-2xl border shadow-sm overflow-hidden"
                  style={{ borderColor: "var(--grid)" }}
                >
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.resume_group_id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${expandedGroups.has(group.resume_group_id) ? "" : "-rotate-90"
                          }`}
                        style={{ color: "var(--ink-fade)" }}
                      />
                      <div>
                        <h2
                          className="text-lg font-semibold"
                          style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
                        >
                          {group.group_name}
                        </h2>
                        <p className="text-sm" style={{ color: "var(--ink-fade)" }}>
                          {group.versions.length} version{group.versions.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Version Cards within group */}
                  {expandedGroups.has(group.resume_group_id) && (
                    <div
                      className="flex flex-col gap-2 px-5 pb-5"
                      style={{ borderTop: "1px solid var(--grid)" }}
                    >
                      {group.versions.map((version, index) => (
                        <div key={version.id} className="flex items-stretch gap-3">
                          {/* Timeline connector */}
                          <div className="flex flex-col items-center pt-4" style={{ width: "20px" }}>
                            <div
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: index === 0 ? "var(--accent)" : "var(--grid)",
                              }}
                            />
                            {index < group.versions.length - 1 && (
                              <div className="flex-1 w-px mt-1" style={{ backgroundColor: "var(--grid)" }} />
                            )}
                          </div>
                          {/* Card */}
                          <div className="flex-1 pt-2">
                            <VersionCard
                              version={version}
                              onDelete={handleDelete}
                              isDeleting={deleting === version.id}
                              onRestore={handleRestoreClick}
                              isRestoring={restoring === version.id}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
