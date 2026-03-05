"use client"

import Link from "next/link"
import { Toaster } from "react-hot-toast"
import { DragSection } from "../../lib/resume-builder/DragSection"
import { Spinner } from "@/lib/shared/components/Spinner"
import { SaveResumeButton } from "@/lib/versions/components/save/SaveResumeButton"
import { ChevronLeft, Download, Sparkles } from "lucide-react"
import { ResumeBuilderPreview } from "./ResumeBuilderPreview"
import { TemplateSelectorButton } from "@/lib/resume-builder/TemplateSelectorButton"
import { EditOverrideModal } from "@/lib/resume-builder/edit/EditOverrideModal"
import { TailorModal } from "@/lib/tailor/components/TailorModal"
import { useTailorRerank } from "@/lib/tailor/useTailorRerank"
import type { CanonItem } from "@/lib/shared/types"
import { formatDateTime, formatDate } from "@/lib/shared/utils"
import { useResumeBuilder } from "@/lib/resume-builder/useResumeBuilder"

export default function ResumeBuilderClient({
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
  const {
    allItems,
    itemTypes,
    editingItem,
    setEditingItem,
    workingState,
    workingStateSaving,
    isDirty,
    isSelected,
    toggleItem,
    updateStateLocally,
    syncToBackend,
    updatedAt,
    getOverride,
    saveOverride,
    clearOverride,
    setTemplate,
    getTypeName,
    sections,
    setSections,
    previewSections,
    previewProfile,
    selectedTemplateId,
    exportingPdf,
    handleExportPdf,
    draggedItem,
    setDraggedItem,
    draggedSection,
    setDraggedSection,
    handleItemDragEnd,
    isDragging,
    saveItemPosition,
    isLoading,
  } = useResumeBuilder(userName)

  // Tailor modal state and handler
  const { showTailorModal, setShowTailorModal, tailoring, handleTailor } = useTailorRerank(
    sections,
    setSections,
    workingState,
    updateStateLocally
  )
  if (isLoading) {
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
      <div
        className="page-bg-gradient"
        style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
      />

      {/* Two-column body — each column scrolls independently, navbar offset at top */}
      <div
        className="relative z-10 flex flex-1 min-h-0 gap-6 px-8"
        style={{ paddingTop: "calc(var(--navbar-height, 4rem) + 4rem)", paddingBottom: "1.5rem" }}
      >
        {/* Left column — fixed height with internal scroll */}
        <div className="flex-1 min-w-0 flex flex-col relative" style={{ height: "100%" }}>
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex flex-row justify-between items-center gap-2 z-20 shrink-0 mb-6">
            <div className="flex flex-row items-center gap-6">
              <Link href="/home">
                <ChevronLeft className="h-6 w-6 cursor-pointer text-gray-500 hover:text-gray-900 transition-colors" />
              </Link>
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-2xl font-semibold whitespace-nowrap"
                  style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
                >
                  Resume Builder
                </span>
                {isDirty && (
                  <span className="text-xs" style={{ color: "var(--ink-fade)" }}>
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-row items-center gap-4">
              <div className="flex flex-row items-center justify-center gap-2">
                {/*Tailor Resume Button*/}
                <button
                  type="button"
                  onClick={() => setShowTailorModal(true)}
                  className="btn-primary rounded-lg flex items-center gap-1.5"
                  style={{ padding: "0.8rem", fontSize: "0.8rem" }}
                  title="Tailor resume to a job description"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Tailor
                </button>
                <SaveResumeButton
                  workingState={workingState}
                  parentVersionId={parentVersionId}
                  syncToBackend={syncToBackend}
                />
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="btn-secondary rounded-lg flex items-center gap-1.5"
                  style={{ padding: "0.8rem", fontSize: "0.8rem" }}
                  title="Download resume as PDF"
                >
                  {exportingPdf ? (
                    <Spinner size={13} color="var(--ink)" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Export PDF
                </button>
              </div>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto pb-8 space-y-6"
            style={{ scrollbarGutter: "stable" }}
          >
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
                style={{
                  borderColor: "var(--grid)",
                }}
              >
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
                    onEditOverride={(item: CanonItem<unknown>) => setEditingItem(item)}
                    getOverride={getOverride}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — fixed height with internal scroll */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div
            className="bg-white rounded-2xl border shadow-sm flex flex-col flex-1 overflow-hidden"
            style={{ borderColor: "var(--grid)" }}
          >
            {/* Preview header */}
            <div
              className="p-8 border-b shrink-0 bg-white z-10"
              style={{ borderColor: "var(--grid)" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto 1fr",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                {/* Left: title */}
                <h3
                  className="text-2xl font-semibold"
                  style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
                >
                  Resume Preview
                </h3>

                <TemplateSelectorButton
                  selectedTemplateId={workingState.template_id ?? "classic"}
                  onSelect={(id) => {
                    void setTemplate(id)
                  }}
                />

                <div className="flex flex-col items-end gap-1">
                  {versionName && (
                    <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                      Version: {versionName}
                    </p>
                  )}
                  {(versionSavedAt || updatedAt) && (
                    <p className="text-xs" style={{ color: "var(--ink-fade)" }}>
                      Updated at: {formatDateTime((versionSavedAt || updatedAt)!)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Preview body */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
              <div className="rounded-b-2xl overflow-clip">
                <ResumeBuilderPreview
                  sections={previewSections}
                  profile={previewProfile}
                  selectedTemplate={selectedTemplateId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Override Modal */}
      {editingItem && (
        <EditOverrideModal
          item={editingItem}
          typeName={getTypeName(editingItem.item_type_id)}
          override={getOverride(editingItem.id)}
          onSave={saveOverride}
          onReset={clearOverride}
          onClose={() => setEditingItem(null)}
          saving={workingStateSaving}
        />
      )}

      {/* Tailor Resume Modal */}
      {showTailorModal && (
        <TailorModal
          onTailor={handleTailor}
          onClose={() => setShowTailorModal(false)}
          tailoring={tailoring}
        />
      )}
    </div>
  )
}
