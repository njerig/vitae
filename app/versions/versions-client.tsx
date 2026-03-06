"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { PageHeader } from "@/lib/shared/components/PageHeader"
import { Spinner } from "@/lib/shared/components/Spinner"
import { RestoreConfirmModal } from "@/lib/versions/components/save/RestoreConfirmModal"
import { ChevronRight, ChevronDown, GitBranch, GitCompare } from "lucide-react"
import { useVersion } from "@/lib/versions/useVersion"
import { VersionTree } from "@/lib/versions/components/tree/VersionTree"
import { VersionCard } from "@/lib/versions/components/tree/VersionCard"
import { DiffView } from "@/lib/versions/DiffView"

export default function VersionsClient() {
  const {
    groups,
    loading,
    deleting,
    restoring,
    confirmRestore,
    setConfirmRestore,
    expandedGroups,
    fetchVersions,
    toggleGroup,
    handleDelete,
    handleRestoreClick,
    handleRestoreConfirm,
    showTreeGroups,
    toggleTreeGroup,
  } = useVersion()

  // Controls visibility of the diff checker panel
  const [showDiff, setShowDiff] = useState(false)

  useEffect(() => {
    fetchVersions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="page-container">
        <div className="page-bg-gradient"></div>
        <div className="relative z-10 pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1rem",
              }}
            >
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
                <div className="flex items-center gap-2">
                  {/* Toggle diff checker panel */}
                  {groups.length > 0 && (
                    <button
                      onClick={() => setShowDiff((v) => !v)}
                      className={`btn-secondary rounded-lg flex items-center gap-2 ${showDiff ? "ring-2 ring-offset-1" : ""}`}
                      style={{ fontSize: "0.8rem", padding: "0.8rem" }}
                    >
                      <GitCompare className="h-4 w-4" />
                      Compare Versions
                    </button>
                  )}
                  <Link href="/resume">
                    <button className="btn-primary rounded-lg flex items-center gap-2">
                      Resume Builder
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              }
            />
          </div>

          {/* Diff Checker - shown when user clicks the Diff Check button */}
          {groups.length > 0 && showDiff && (
            <div
              className="bg-white rounded-2xl border shadow-sm p-8"
              style={{ borderColor: "var(--grid)" }}
            >
              <DiffView groups={groups} />
            </div>
          )}

          {/* Empty State */}
          {groups.length === 0 ? (
            <div
              className="bg-white rounded-2xl border p-12 text-center shadow-sm"
              style={{ borderColor: "var(--grid)" }}
            >
              <p style={{ color: "var(--ink-fade)", fontSize: "1.125rem", marginBottom: "1rem" }}>
                No saved resumes yet. Create one from the Resume Builder!
              </p>
              <Link href="/resume">
                <button className="btn-primary">Go to Resume Builder</button>
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
                  <div className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => toggleGroup(group.resume_group_id)}
                      className="flex-1 flex items-center gap-3 text-left p-2"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedGroups.has(group.resume_group_id) ? "" : "-rotate-90"
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
                    </button>

                    <div className="px-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTreeGroup(group.resume_group_id)
                          // Auto expand group when showing tree
                          if (
                            !showTreeGroups.has(group.resume_group_id) &&
                            !expandedGroups.has(group.resume_group_id)
                          ) {
                            toggleGroup(group.resume_group_id)
                          }
                        }}
                        className={`p-2 rounded-md transition-colors ${showTreeGroups.has(group.resume_group_id) ? "bg-indigo-50 hover:bg-indigo-100" : "hover:bg-gray-100"}`}
                        title={
                          showTreeGroups.has(group.resume_group_id)
                            ? "Hide Tree View"
                            : "Show Tree View"
                        }
                      >
                        <GitBranch
                          className="h-5 w-5"
                          style={{
                            color: showTreeGroups.has(group.resume_group_id)
                              ? "var(--accent)"
                              : "var(--ink-fade)",
                          }}
                        />
                      </button>
                    </div>
                  </div>

                  {showTreeGroups.has(group.resume_group_id) ? (
                    <div className="p-5 border-t" style={{ borderColor: "var(--grid)" }}>
                      <VersionTree
                        versions={group.versions}
                        onDelete={handleDelete}
                        onRestore={handleRestoreClick}
                        deleting={deleting}
                        restoring={restoring}
                      />
                    </div>
                  ) : (
                    /* Version Cards within group */
                    expandedGroups.has(group.resume_group_id) && (
                      <div
                        className="flex flex-col gap-2 px-5 pb-5"
                        style={{ borderTop: "1px solid var(--grid)" }}
                      >
                        {group.versions.map((version, index) => (
                          <div key={version.id} className="flex items-stretch gap-3">
                            {/* Timeline connector */}
                            <div
                              className="flex flex-col items-center pt-4"
                              style={{ width: "20px" }}
                            >
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: index === 0 ? "var(--accent)" : "var(--grid)",
                                }}
                              />
                              {index < group.versions.length - 1 && (
                                <div
                                  className="flex-1 w-px mt-1"
                                  style={{ backgroundColor: "var(--grid)" }}
                                />
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
                    )
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
