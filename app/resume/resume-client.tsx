"use client"

import Link from "next/link"
import { useCanon } from "@/lib/canon/useCanon"
import { useMemo, useCallback } from "react"
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
import { formatDateTime, formatDate} from "@/lib/utils"


export default function ResumeClient({ userName, versionName, versionSavedAt }: { userName: string; userId: string; versionName: string | null; versionSavedAt: string | null }) {
  const { allItems, itemTypes, loading, patch } = useCanon()
export default function ResumeClient({ userName }: { userName: string; userId: string }) {
  const { allItems, itemTypes, loading } = useCanon()

  
  // Manage sections with working state
  const { 
    state: workingState, 
    loading: workingStateLoading, 
    saving: workingStateSaving, 
    saveState,
    isSelected,
    toggleItem,
    updatedAt
  } = useWorkingState()
  
  // Manage sections with working state
  const { sections, setSections } = useResumeSections(
    allItems,
    itemTypes,
    workingState,
    workingStateLoading,
    saveState
  )


  const filteredSections = useMemo(() => {
    const selectedIds = new Set(workingState.sections.flatMap(s => s.item_ids))
    if (selectedIds.size === 0) return []
    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(item => selectedIds.has(item.id))
      }))
      .filter(section => section.items.length > 0)
  }, [sections, workingState.sections])
  const previewProfile = useMemo(() => ({ name: userName }), [userName])


  const saveItemPosition = useCallback(async (_itemId: string, _position: number) => {}, [])

    const {
    draggedItem,
    setDraggedItem,
    draggedSection,
    setDraggedSection,
    handleItemDragEnd,
    isDragging
  } = useDragState(sections, saveItemPosition)

  // Loading state
  const isLoading = loading || workingStateLoading
  if (isLoading) {
    return (
      <div className="page-container">
        <div className="page-bg-gradient"></div>
        <div className="relative z-10 pt-32 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <Spinner size={40} />
              <p style={{ color: "var(--ink-light)" }}>Loading your resume...</p>
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

      <div className="relative z-10 pt-32 pb-16 px-8">
        <div className="max-w-full mx-auto px-4">
          {/* Saving indicator */}
          {workingStateSaving && (
            <div className="fixed top-4 right-4 z-50 bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-gray-200">
              <Spinner size={16} />
              <span className="text-sm text-gray-600">Auto-saving...</span>
            </div>
          )}
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Resume Builder */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex flex-row justify-between items-center gap-4">
                <div className="flex flex-row items-center gap-6">
                  <Link href="/home">
                    <ChevronLeft className="h-6 w-6 cursor-pointer text-gray-500 hover:text-gray-900 transition-colors" />
                  </Link>
                  <PageHeader
                    title="Resume Builder"
                    subtitle="Drag to reorder sections and items."
                  />
                </div>
                <div className="flex flex-row items-center gap-4">
                  <div className="flex flex-row items-center justify-center">
                    <SaveResumeButton workingState={workingState} />
                  </div>
                  {workingStateSaving && (
                    <span className="text-sm text-gray-500 flex items-center whitespace-nowrap">
                      <Spinner size={14} />
                      <span className="ml-2">Saving...</span>
                    </span>
                  )}
                </div>
              </div>

              {isDragging && (
                <div className="rounded-xl p-4" style={{
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--accent-hover)"
                }}>
                  <p className="text-sm" style={{ color: "var(--paper)" }}>
                    <strong>Drop to reorder.</strong> Item order will be saved automatically.
                  </p>
                </div>
              )}

              {sections.length === 0 ? (
                <div className="bg-white rounded-2xl border p-12 text-center shadow-sm" style={{
                  borderColor: "var(--grid)"
                }}>
                  <p style={{ color: "var(--ink-fade)" }}>
                    No items yet. Add some items to your Career History to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sections.map((section, sectionIndex) => (
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
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Resume Preview */}
            <div className="lg:sticky lg:top-32 h-fit">
              <div className="bg-white rounded-2xl border shadow-sm min-h-150" style={{ 
                borderColor: "var(--grid)"
              }}>
                <div className="p-8 border-b" style={{ borderColor: "var(--grid)" }}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-semibold" style={{ 
                      color: "var(--ink)",
                      fontFamily: "var(--font-serif)"
                    }}>
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
                    {workingStateSaving && (
                      <span className="text-sm text-gray-500 flex items-center">
                        <Spinner size={14} />
                        <span className="ml-1">Auto-saving...</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-8">
                  <ResumePreview
                    sections={filteredSections.length > 0 ? filteredSections : sections}
                    profile={previewProfile}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}