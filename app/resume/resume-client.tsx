"use client"

import Link from "next/link"
import { useCanon } from "@/lib/canon/useCanon"
import { useCallback } from "react"
import { useWorkingState } from "@/lib/working-state/useWorkingState"
import { useResumeSections } from "../../lib/resume-builder/useResumeSections"
import { useDragState } from "../../lib/resume-builder/useDragState"
import { formatDate } from "./utils"
import { DragSection } from "../_components/resume/DragSection"
import { Spinner } from "@/lib/components/Spinner"
import { PageHeader } from "@/lib/components/PageHeader"
import { ResumePreview } from "./ResumePreview"

export default function ResumeClient({ userName }: { userName: string; userId: string }) {
  const { allItems, itemTypes, loading, patch } = useCanon()
  const { state: workingState, loading: workingStateLoading, saving: workingStateSaving, saveState } = useWorkingState()
  
  // Manage sections with working state
  const { sections, setSections } = useResumeSections(
    allItems,
    itemTypes,
    workingState,
    workingStateLoading,
    saveState
  )

  // Save item position to database
  const saveItemPosition = useCallback(async (itemId: string, position: number) => {
    try {
      console.log("Saving item position:", itemId, position)
      await patch(itemId, { position })
    } catch (error) {
      console.error("Failed to save item position:", error)
    }
  }, [patch])

  // Manage drag and drop state
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
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <PageHeader
                  title="Resume Builder"
                  subtitle="Drag to reorder sections and items. Changes are auto-saved."
                  actions={
                    <>
                      <Link href="/home">
                        <button className="btn-secondary rounded-lg flex items-center gap-2 mr-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                          </svg>
                          Career History
                        </button>
                      </Link>
                      {workingStateSaving && (
                        <span className="text-sm text-gray-500 flex items-center">
                          <Spinner size={14} />
                          <span className="ml-2">Saving...</span>
                        </span>
                      )}
                    </>
                  }
                />
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
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Resume Preview */}
            <div className="lg:sticky lg:top-32 h-fit">
              <div className="bg-white rounded-2xl border shadow-sm min-h-[600px]" style={{ 
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
                    {workingStateSaving && (
                      <span className="text-sm text-gray-500 flex items-center">
                        <Spinner size={14} />
                        <span className="ml-1">Auto-saving...</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-8">
                  <ResumePreview sections={sections} profile={{ name: userName }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}