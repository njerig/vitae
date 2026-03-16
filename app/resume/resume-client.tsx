"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { DragSection } from "../../lib/resume-builder/components/drag/DragSection"
import { Spinner } from "@/lib/shared/components/Spinner"
import { SegmentedSwitch } from "@/lib/shared/components/SegmentedSwitch"
import { SaveResumeButton } from "@/lib/versions/components/save/SaveResumeButton"
import { ChevronLeft, Download } from "lucide-react"
import { ResumePreview } from "@/lib/resume-builder/components/ResumePreview"
import { TemplateSelectorButton } from "@/lib/resume-builder/components/TemplateSelectorButton"
import { EditOverrideModal } from "@/lib/resume-builder/components/edit/EditOverrideModal"
import { TailoringStudioCard } from "@/lib/resume-builder/tailor/ai/components/TailoringStudioCard"
import { AIItemTailorModal } from "@/lib/resume-builder/tailor/ai/components/ItemTailorModal"
import { useTailorPrioritization } from "@/lib/resume-builder/tailor/useTailorPrioritization"
import type { ArchivedCanonItem, CanonItem } from "@/lib/shared/types"
import type { TailoringAxes } from "@/lib/resume-builder/tailor/options"
import { formatDateTime, formatDate } from "@/lib/shared/utils"
import { useResumeBuilder } from "@/lib/resume-builder/useResumeBuilder"

// -- Types ---------------------------------------------------------------------

type AITargetItem = {
  id: string
  type_name: string
  title: string
  content: Record<string, unknown>
}

type AITarget = {
  title: string
  subtitle?: string
  items: AITargetItem[]
}

type ItemTweaksOverride = {
  item_id: string
  content?: { bullets?: string[] }
}

type OverrideRecord = Record<string, { title?: string; content?: Record<string, unknown> }>

type TailoringContextSavePayload = {
  contextType: "job_description" | "audience"
  contextText: string
  contextTexts: {
    job_description: string
    audience: string
  }
  axes: TailoringAxes
}

// -- Helpers -------------------------------------------------------------------

/**
 * Reads archived canon items restored for a specific parent version.
 *
 * @param versionId - Parent version ID used as the storage key suffix.
 * @returns Archived items when available; otherwise null.
 */
function readArchivedItemsFromSession(versionId: string): ArchivedCanonItem[] | null {
  const key = `archived_items_${versionId}`
  const raw = sessionStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ArchivedCanonItem[]
  } catch {
    return null
  } finally {
    sessionStorage.removeItem(key)
  }
}

/**
 * Merges AI bullet overrides into an existing override dictionary.
 *
 * @param currentOverrides - Existing persisted override map.
 * @param incomingOverrides - New bullet overrides from the AI modal.
 * @returns A merged override map preserving prior title/content fields.
 */
function mergeItemOverrides(
  currentOverrides: OverrideRecord | undefined,
  incomingOverrides: ItemTweaksOverride[]
): OverrideRecord {
  const nextOverrides: OverrideRecord = { ...(currentOverrides || {}) }
  for (const override of incomingOverrides) {
    const current = nextOverrides[override.item_id]
    nextOverrides[override.item_id] = {
      ...(current?.title ? { title: current.title } : {}),
      ...(current?.content || override.content
        ? {
            content: {
              ...(current?.content || {}),
              ...(override.content || {}),
            },
          }
        : {}),
    }
  }
  return nextOverrides
}

/**
 * Resume builder page client component.
 *
 * @param props - Resume page shell metadata.
 * @param props.userName - Current user's display name.
 * @param props.versionName - Active version label, if any.
 * @param props.versionSavedAt - Active version save timestamp.
 * @param props.parentVersionId - Parent version ID used during restore.
 * @returns Resume builder page UI.
 */
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
  // -- Local State -------------------------------------------------------------

  // When the user restores an old version, archived items that were deleted
  // but referenced by the snapshot are stored in sessionStorage by useVersion.
  // Read them here so the preview can render them without polluting the canon list.
  const [archivedItems, setArchivedItems] = useState<ArchivedCanonItem[]>([])
  const [editMode, setEditMode] = useState<"manual" | "ai">("manual")
  const [manualDirty, setManualDirty] = useState(false)
  const [aiDirty, setAiDirty] = useState(false)
  const [aiResetSignal, setAiResetSignal] = useState(0)
  const [aiStudioExpanded, setAiStudioExpanded] = useState(false)
  const [pendingTransition, setPendingTransition] = useState<null | (() => void)>(null)
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false)
  const [aiTarget, setAiTarget] = useState<AITarget | null>(null)

  // -- Effects -----------------------------------------------------------------

  useEffect(() => {
    if (!parentVersionId) return
    const restoredItems = readArchivedItemsFromSession(parentVersionId)
    if (!restoredItems) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArchivedItems(restoredItems)
  }, [parentVersionId])

  // -- Data Hooks --------------------------------------------------------------

  const {
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
    setTailoringContext,
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
    isLoading,
  } = useResumeBuilder(userName, archivedItems)

  const { tailoring, handleTailor } = useTailorPrioritization(
    sections,
    setSections,
    workingState,
    updateStateLocally
  )

  const savedTailoringContext = workingState.tailoring_context

  // -- Event Handlers ----------------------------------------------------------

  /**
   * Persists global tailoring context and slider values.
   *
   * @param payload - Context values from Tailoring Studio.
   * @returns Promise that resolves when state is persisted.
   */
  const handleSaveTailoringContext = async (payload: TailoringContextSavePayload) => {
    await setTailoringContext(
      {
        context_type: payload.contextType,
        context_text: payload.contextText,
        context_text_by_type: payload.contextTexts,
        axes: payload.axes,
      },
      { persist: true }
    )
  }

  /**
   * Applies AI-generated bullet overrides to working state and persists them.
   *
   * @param overrides - Item-level bullet overrides generated by AI.
   * @returns Promise that resolves after local and backend state updates.
   */
  const applyAiItemTweaks = async (overrides: ItemTweaksOverride[]) => {
    if (overrides.length === 0) return

    const nextState = {
      ...workingState,
      overrides: mergeItemOverrides(workingState.overrides, overrides),
    }
    updateStateLocally(nextState)
    await syncToBackend(nextState)
  }

  // -- Transition Guards -------------------------------------------------------

  /**
   * Guards mode/modal transitions when there are unapplied edits.
   *
   * @param nextAction - Action to run after guard passes.
   * @param discardCurrentContext - Action to clear local unsaved edits when discarding.
   * @returns Void.
   */
  const requestTransition = (nextAction: () => void, discardCurrentContext: () => void) => {
    const hasUnappliedChanges = editMode === "manual" ? manualDirty : aiDirty
    if (!hasUnappliedChanges) {
      nextAction()
      return
    }
    setPendingTransition(() => () => {
      discardCurrentContext()
      nextAction()
    })
    setShowUnsavedPrompt(true)
  }

  /**
   * Requests switching between manual and AI modes with unsaved-change protection.
   *
   * @param targetMode - Requested editing mode.
   * @returns Void.
   */
  const requestModeChange = (targetMode: "manual" | "ai") => {
    if (targetMode === editMode) return
    requestTransition(
      () => {
        setEditMode(targetMode)
        if (targetMode === "ai") setAiStudioExpanded(false)
      },
      () => {
        if (editMode === "manual") {
          setEditingItem(null)
          setManualDirty(false)
        } else {
          setAiDirty(false)
          setAiResetSignal((n) => n + 1)
          setAiStudioExpanded(false)
        }
      }
    )
  }

  /**
   * Requests closing the manual edit modal with unsaved-change protection.
   *
   * @returns Void.
   */
  const requestManualClose = () => {
    requestTransition(
      () => setEditingItem(null),
      () => {
        setEditingItem(null)
        setManualDirty(false)
      }
    )
  }

  // -- Render ------------------------------------------------------------------

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
                {/*Tailor Resume */}
                <SegmentedSwitch
                  value={editMode}
                  onChange={(next) => requestModeChange(next)}
                  options={[
                    { value: "manual", label: "Manual" },
                    { value: "ai", label: "AI Tailor" },
                  ]}
                  variant="primary"
                  size="sm"
                  ariaLabel="Resume editing mode"
                />

                {/* Save Resume */}
                <SaveResumeButton
                  workingState={workingState}
                  parentVersionId={parentVersionId}
                  syncToBackend={syncToBackend}
                />

                {/* Export Resume */}
                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={exportingPdf}
                  className="btn-secondary h-14 rounded-lg flex items-center justify-center gap-1.5 w-32"
                  style={{ padding: "0.8rem", fontSize: "0.8rem" }}
                  title="Download resume as PDF"
                >
                  {exportingPdf ? (
                    <Spinner size={13} color="var(--ink)" />
                  ) : (
                    <Download className="w-6 h-6" />
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

            {editMode === "ai" && (
              <TailoringStudioCard
                initialContextType={savedTailoringContext?.context_type}
                initialContextText={savedTailoringContext?.context_text}
                initialContextTexts={savedTailoringContext?.context_text_by_type}
                initialAxes={savedTailoringContext?.axes}
                onSaveContext={handleSaveTailoringContext}
                onTailor={handleTailor}
                tailoring={tailoring}
                expanded={aiStudioExpanded}
                onExpandedChange={setAiStudioExpanded}
                onDirtyChange={setAiDirty}
                resetSignal={aiResetSignal}
              />
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
                    formatDate={formatDate}
                    handleItemDragEnd={handleItemDragEnd}
                    isSelected={isSelected}
                    toggleItem={toggleItem}
                    onEditOverride={(item: CanonItem<unknown>) => {
                      if (editMode === "manual") {
                        setEditingItem(item)
                        return
                      }
                      if (!isSelected(item.id)) {
                        toast("Select this item first to include it in AI tailoring.")
                        return
                      }
                      setAiTarget({
                        title: item.title || "Untitled item",
                        subtitle: section.typeName,
                        items: [
                          {
                            id: item.id,
                            type_name: section.typeName,
                            title: item.title || "Untitled item",
                            content: (item.content ?? {}) as Record<string, unknown>,
                          },
                        ],
                      })
                    }}
                    onTailorSection={(sectionToTailor: {
                      typeName: string
                      items: CanonItem[]
                    }) => {
                      if (editMode !== "ai") return
                      const selectedItems = sectionToTailor.items.filter((item) =>
                        isSelected(item.id)
                      )
                      if (selectedItems.length === 0) {
                        toast("Select at least one item in this section before AI tailoring.")
                        return
                      }
                      setAiTarget({
                        title: sectionToTailor.typeName,
                        subtitle: `${selectedItems.length} selected item(s)`,
                        items: selectedItems.map((item) => ({
                          id: item.id,
                          type_name: sectionToTailor.typeName,
                          title: item.title || "Untitled item",
                          content: (item.content ?? {}) as Record<string, unknown>,
                        })),
                      })
                    }}
                    getOverride={getOverride}
                    itemActionMode={editMode}
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
                <ResumePreview
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
          onClose={requestManualClose}
          saving={workingStateSaving}
          onDirtyChange={setManualDirty}
        />
      )}

      {showUnsavedPrompt && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: "420px" }}>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--ink)" }}>
              Unapplied changes
            </h3>
            <p className="text-sm mb-5" style={{ color: "var(--ink-fade)" }}>
              You have unapplied changes. Stay to keep editing, or discard to continue.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowUnsavedPrompt(false)
                  setPendingTransition(null)
                }}
              >
                Stay
              </button>
              <button
                type="button"
                className="card-action-delete-negative"
                onClick={() => {
                  const next = pendingTransition
                  setShowUnsavedPrompt(false)
                  setPendingTransition(null)
                  next?.()
                }}
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {aiTarget && (
        <AIItemTailorModal
          title={aiTarget.title}
          subtitle={aiTarget.subtitle}
          context={savedTailoringContext}
          items={aiTarget.items}
          onApply={applyAiItemTweaks}
          onClose={() => setAiTarget(null)}
        />
      )}
    </div>
  )
}
