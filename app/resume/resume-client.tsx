"use client"

import Link from "next/link"
import { useCanon } from "@/lib/canon/useCanon"
import { useMemo, useCallback, useEffect, useRef } from "react"
import toast, { Toaster } from "react-hot-toast"
import { DragSection } from "../_components/resume/DragSection"
import { Spinner } from "@/lib/components/Spinner"
import { PageHeader } from "@/lib/components/PageHeader"
import { useWorkingState } from "@/lib/working-state/useWorkingState"
import { SaveResumeButton } from "@/lib/versions/SaveResumeButton"
import { ChevronLeft } from "lucide-react"
import { ResumePreview } from "./ResumePreview"
import { useDragState } from "@/lib/resume-builder/useDragState"
import { useResumeSections } from "@/lib/resume-builder/useResumeSection"
import type { CanonItem, ItemType } from "@/lib/types"
import { formatDateTime, formatDate } from "@/lib/utils"

export default function ResumeClient({
  userName,
  versionName,
  versionSavedAt,
  parentVersionId,
}: {
  userName: string
  userId: string
  versionName: string | null
  versionSavedAt: string | null
  parentVersionId: string | null
}) {
  const { allItems, itemTypes, loading } = useCanon()

  const {
    state: workingState,
    loading: workingStateLoading,
    saving: workingStateSaving,
    isDirty,
    isSelected,
    toggleItem,
    updateStateLocally,
    syncToBackend,
    updatedAt,
  } = useWorkingState()

  const { sections, setSections } = useResumeSections(allItems, itemTypes, workingState, workingStateLoading, updateStateLocally)

  const filteredSections = useMemo(() => {
    const selectedIds = new Set(workingState.sections.flatMap((s) => s.item_ids))
    if (selectedIds.size === 0) return []
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => selectedIds.has(item.id)),
      }))
      .filter((section) => section.items.length > 0)
  }, [sections, workingState.sections])

  const previewProfile = useMemo(() => ({ name: userName }), [userName])

  const saveItemPosition = useCallback(async (_itemId: string, _position: number) => { }, [])

  const { draggedItem, setDraggedItem, draggedSection, setDraggedSection, handleItemDragEnd, isDragging } = useDragState(sections, saveItemPosition)

  const savingToastId = useRef<string | null>(null)

  useEffect(() => {
    if (workingStateSaving) {
      if (!savingToastId.current) {
        savingToastId.current = toast.loading("Saving...", { position: "top-center" })
      }
    } else {
      if (savingToastId.current) {
        toast.dismiss(savingToastId.current)
        savingToastId.current = null
      }
    }
  }, [workingStateSaving])

  const isLoading = loading || workingStateLoading
  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-bg-gradient"></div>
        <div className="relative z-10 pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <Spinner size={40} />
              <p style={{ color: "var(--ink-light)" }}>Loading your resume...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    // Full viewport height — no page-level scroll
    <div
      className="page-container"
      style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{ style: { zIndex: 99999 } }}
      />
      <div className="page-bg-gradient" style={{ position: "fixed", inset: 0, pointerEvents: "none" }} />

      {/* Two-column body — each column scrolls independently, navbar offset at top */}
      <div
        className="relative z-10 flex flex-1 min-h-0 gap-6 px-8"
        style={{ paddingTop: "calc(var(--navbar-height, 4rem) + 4rem)", paddingBottom: "1.5rem" }}
      >

        {/* Left column — scrolls independently */}
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
          <div className="space-y-6 pb-8">

            {/* Header card — back button + title + save button, exactly as original */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex flex-row justify-between items-center gap-4">
              <div className="flex flex-row items-center gap-6">
                <Link href="/home">
                  <ChevronLeft className="h-6 w-6 cursor-pointer text-gray-500 hover:text-gray-900 transition-colors" />
                </Link>
                <PageHeader title="Resume Builder" subtitle="Drag to reorder sections and items." />
              </div>
              <div className="flex flex-row items-center gap-4">
                {isDirty && (
                  <span className="text-xs" style={{ color: "var(--ink-fade)" }}>Unsaved changes</span>
                )}
                <div className="flex flex-row items-center justify-center">
                  <SaveResumeButton
                    workingState={workingState}
                    parentVersionId={parentVersionId}
                    syncToBackend={syncToBackend}
                  />
                </div>
              </div>
            </div>

            {isDragging && (
              <div
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--accent)", borderColor: "var(--accent-hover)" }}
              >
                <p className="text-sm" style={{ color: "var(--paper)" }}>
                  <strong>Drop to reorder.</strong> Item order will be saved automatically.
                </p>
              </div>
            )}

            {sections.length === 0 ? (
              <div
                className="bg-white rounded-2xl border p-12 text-center shadow-sm"
                style={{ borderColor: "var(--grid)" }}
              >
                <p style={{ color: "var(--ink-fade)" }}>
                  No items yet. Add some items to your Career History to get started!
                </p>
              </div>
            ) : (
              sections.map((section, sectionIndex) => (
                <DragSection
                  key={section.typeId}
                  section={section}
                  sectionIndex={sectionIndex}
                  sections={sections}
                  setSections={setSections}
                  draggedSection={draggedSection}
                  setDraggedSection={setDraggedSection}
                  draggedItem={draggedItem}
                  setDraggedItem={setDraggedItem}
                  saveItemPosition={saveItemPosition}
                  formatDate={formatDate}
                  handleItemDragEnd={handleItemDragEnd}
                  isSelected={isSelected}
                  toggleItem={toggleItem}
                />
              ))
            )}
          </div>
        </div>

        {/* Right column — scrolls independently */}
        <div className="flex-1 min-w-0 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
          <div
            className="bg-white rounded-2xl border shadow-sm flex flex-col"
            style={{ borderColor: "var(--grid)", minHeight: "100%" }}
          >
            {/* Preview header card — exactly as original */}
            <div className="p-8 border-b flex-shrink-0" style={{ borderColor: "var(--grid)" }}>
              <div className="flex justify-between items-center">
                <h3
                  className="text-2xl font-semibold"
                  style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
                >
                  Resume Preview
                </h3>
                <div className="flex flex-col items-start gap-1">
                  {versionName && (
                    <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                      Version: {versionName}
                    </p>
                  )}
                  {(versionSavedAt || updatedAt) && (
                    <p className="text-sm" style={{ color: "var(--ink-fade)" }}>
                      Updated at: {formatDateTime((versionSavedAt || updatedAt)!)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Preview body */}
            <div className="flex-1 overflow-hidden rounded-b-2xl">
              <ResumePreview
                sections={filteredSections.length > 0 ? filteredSections : sections}
                profile={previewProfile}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}