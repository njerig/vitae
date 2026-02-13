"use client"

import Link from "next/link"
import { useCanon } from "@/lib/canon/useCanon"
import { useMemo, useCallback, useState } from "react"
import { DragSection } from "../_components/resume/DragSection"
import { Spinner } from "@/lib/components/Spinner"
import { PageHeader } from "@/lib/components/PageHeader"
import { useWorkingState } from "@/lib/working-state/useWorkingState"
import { SaveResumeButton } from "@/lib/versions/SaveResumeButton"
import { ChevronLeft } from "lucide-react"
import toast from "react-hot-toast"
import { ResumePreview } from "./ResumePreview"
import { useDragState } from "@/lib/resume-builder/useDragState"
import { useResumeSections } from "@/lib/resume-builder/useResumeSections"

const formatDate = (dateString: string): string => {
  if (!dateString) return ""
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

export default function ResumeClient({ userName }: { userName: string; userId: string }) {
  const { allItems, itemTypes, loading, patch } = useCanon()

  // Manage sections with working state
  const { 
    state: workingState, 
    loading: workingStateLoading, 
    saveState,
    isSelected,
    toggleItem 
  } = useWorkingState()
  
  // Manage sections without auto-save
  const { 
    sections, 
    setSections, 
    hasUnsavedChanges, 
    getStateToSave, 
    markAsSaved 
  } = useResumeSections(
    allItems,
    itemTypes,
    workingState,
    workingStateLoading
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

  const {
    draggedItem,
    setDraggedItem,
    draggedSection,
    setDraggedSection,
    handleItemDragEnd,
    isDragging,
    hasUnsavedPositions,
    getPendingUpdates,
    clearPendingUpdates
  } = useDragState(sections)

  // Save everything when button is pressed
  const handleSave = useCallback(async () => {
    const saveToastId = toast.loading("Saving changes...")
    
    try {
      // Save section order and item selections
      if (hasUnsavedChanges) {
        await saveState(getStateToSave())
        markAsSaved()
      }

      // Save item positions
      if (hasUnsavedPositions) {
        const updates = getPendingUpdates()
        await Promise.all(
          updates.map(({ itemId, position }) => patch(itemId, { position }))
        )
        clearPendingUpdates()
      }
      
      toast.success("Changes saved successfully!", { id: saveToastId })
    } catch (error) {
      console.error("Failed to save changes:", error)
      toast.error("Failed to save changes. Please try again.", { id: saveToastId })
    }
  }, [
    hasUnsavedChanges, 
    hasUnsavedPositions, 
    getStateToSave, 
    saveState, 
    markAsSaved, 
    getPendingUpdates, 
    clearPendingUpdates,
    patch
  ])

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

  const hasAnyUnsavedChanges = hasUnsavedChanges || hasUnsavedPositions

  return (
    <div className="page-container">
      <div className="page-bg-gradient"></div>
      <div className="page-accent-light"></div>

      <div className="relative z-10 pt-32 pb-16 px-8">
        <div className="max-w-full mx-auto px-4">
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
                  <SaveResumeButton 
                    workingState={workingState}
                    onBeforeSave={async () => {
                      // Save item positions when SaveResumeButton is clicked
                      if (hasUnsavedPositions) {
                        const updates = getPendingUpdates()
                        await Promise.all(
                          updates.map(({ itemId, position }) => patch(itemId, { position }))
                        )
                        clearPendingUpdates()
                      }
                      // Save section order
                      if (hasUnsavedChanges) {
                        await saveState(getStateToSave())
                        markAsSaved()
                      }
                    }}
                    hasUnsavedChanges={hasAnyUnsavedChanges}
                  />
                </div>
              </div>

              {isDragging && (
                <div className="rounded-xl p-4" style={{
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--accent-hover)"
                }}>
                  <p className="text-sm" style={{ color: "var(--paper)" }}>
                    <strong>Drop to reorder.</strong> Changes will be saved when you click Save Changes.
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
                  <h3 className="text-2xl font-semibold" style={{ 
                    color: "var(--ink)",
                    fontFamily: "var(--font-serif)"
                  }}>
                    Resume Preview
                  </h3>
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