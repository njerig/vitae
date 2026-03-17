"use client"

import { useState } from "react"
import { Toaster } from "react-hot-toast"
import { EditOverrideModal } from "@/lib/resume-builder/components/edit/EditOverrideModal"
import { ResumeLoadingView } from "@/lib/resume-builder/components/ResumeLoadingView"
import { AIItemTailorModal } from "@/lib/resume-builder/tailor/ai/components/ItemTailorModal"
import { useTailorPrioritization } from "@/lib/resume-builder/tailor/useTailorPrioritization"
import type { TailoringAxes } from "@/lib/resume-builder/tailor/options"
import { formatDateTime, formatDate } from "@/lib/shared/utils"
import { useResumeBuilder } from "@/lib/resume-builder/useResumeBuilder"
import { useRestoredArchivedItems } from "@/lib/resume-builder/useRestoredArchivedItems"
import { useUnsavedChangesGuard } from "@/lib/resume-builder/useUnsavedChangesGuard"
import { UnsavedChangesModal } from "@/lib/resume-builder/components/UnsavedChangesModal"
import { ResumeBuilderToolbar } from "@/lib/resume-builder/components/ResumeBuilderToolbar"
import { ResumeEditorPane } from "@/lib/resume-builder/components/ResumeEditorPane"
import { ResumePreviewPane } from "@/lib/resume-builder/components/ResumePreviewPane"

type AITargetItem = {
  id: string
  type_name: string
  title: string
  content: Record<string, unknown>
}

// Represents a group of items (e.g. a section or single item) sent to the AI tailor modal
type AITarget = {
  title: string
  subtitle?: string
  items: AITargetItem[]
}

// A per-item override carrying optional AI-rewritten bullet points
type ItemTweaksOverride = {
  item_id: string
  content?: { bullets?: string[] }
}

// The full override map stored in working state: item ID → overridden title/content
type OverrideRecord = Record<string, { title?: string; content?: Record<string, unknown> }>

// Payload shape emitted by TailoringStudioCard when the user saves tailoring context
type TailoringContextSavePayload = {
  contextType: "job_description" | "audience"
  contextText: string
  contextTexts: {
    job_description: string
    audience: string
  }
  axes: TailoringAxes
}

// Merge AI bullet overrides without clobbering existing manual fields
function mergeItemOverrides(
  currentOverrides: OverrideRecord | undefined,
  incomingOverrides: ItemTweaksOverride[]
): OverrideRecord {
  const nextOverrides: OverrideRecord = { ...(currentOverrides || {}) }
  for (const override of incomingOverrides) {
    const current = nextOverrides[override.item_id]
    // Shallow-merge content so that AI bullet changes don't wipe unrelated fields
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
  const archivedItems = useRestoredArchivedItems(parentVersionId)
  const [aiResetSignal, setAiResetSignal] = useState(0)

  // Whether the AI Tailoring Studio panel is expanded
  // Whether the AI Tailoring Studio panel is expanded
  const [aiStudioExpanded, setAiStudioExpanded] = useState(false)

  // When a guarded transition is blocked by unsaved changes, the deferred action
  // is stored here so it can be executed after the user confirms "Discard"
  const [pendingTransition, setPendingTransition] = useState<null | (() => void)>(null)

  // Controls visibility of the unsaved-changes confirmation modal
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false)

  // The item(s) currently targeted by the AI tailor modal (null = modal closed)
  const [aiTarget, setAiTarget] = useState<AITarget | null>(null)

  // -- Effects -----------------------------------------------------------------

  // On mount (or when parentVersionId changes), attempt to hydrate archived items
  // from sessionStorage. This is a one-shot read — the key is cleared after use.
  useEffect(() => {
    if (!parentVersionId) return
    const restoredItems = readArchivedItemsFromSession(parentVersionId)
    if (!restoredItems) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setArchivedItems(restoredItems)
  }, [parentVersionId])
  const {
    editMode,
    showUnsavedPrompt,
    setManualDirty,
    setAiDirty,
    requestModeChange,
    requestManualClose,
    stayWithChanges,
    discardAndContinue,
  } = useUnsavedChangesGuard("manual")

  // Central hook: working state, overrides, drag-and-drop, template, and sync
  const {
    editingItem, // The item currently open in the manual EditOverrideModal
    setEditingItem,
    workingState, // The full in-memory resume state (sections, overrides, template, etc.)
    workingStateSaving, // True while a backend save is in flight
    isDirty, // True if there are unsaved changes to the overall resume state
    isSelected, // (itemId) => boolean — whether an item is checked for AI tailoring
    toggleItem, // Toggles an item's selected state
    updateStateLocally, // Optimistic local state update (no network call)
    syncToBackend, // Persists working state to the API
    updatedAt, // Timestamp of the last successful backend save
    getOverride, // (itemId) => override object or undefined
    saveOverride, // Persists a manual override for a single item
    clearOverride, // Removes the override for a single item
    setTemplate, // Switches the active resume template and persists
    setTailoringContext, // Saves the AI tailoring context (job description / audience)
    getTypeName, // (typeId) => human-readable section name
    sections, // Ordered array of resume sections with their items
    setSections, // Directly update sections (used by drag-and-drop and tailoring)
    previewSections, // Derived sections with overrides applied, used by the preview pane
    previewProfile, // User profile data for the preview header
    selectedTemplateId, // Currently active template ID
    exportingPdf, // True while PDF export is in progress
    handleExportPdf, // Triggers Typst-based PDF generation and download
    draggedItem, // The item currently being dragged (for visual feedback)
    setDraggedItem,
    draggedSection, // The section currently being dragged
    setDraggedSection,
    handleItemDragEnd, // Finalizes item reorder and persists new order to backend
    isDragging, // True if any drag operation is active (shows hint banner)
    isLoading, // True while initial resume data is being fetched
  } = useResumeBuilder(userName, archivedItems)

  // Tailoring sliders + reorder action
  const { tailoring, handleTailor } = useTailorPrioritization(
    sections,
    setSections,
    workingState,
    updateStateLocally
  )

  // Snapshot used to prefill the tailoring studio card
  const savedTailoringContext = workingState.tailoring_context

  // Persist tailoring context and slider values
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

  // Merge AI bullet tweaks into working state and persist
  const applyAiItemTweaks = async (overrides: ItemTweaksOverride[]) => {
    if (overrides.length === 0) return

    // Build the next state with merged overrides, then push optimistically and sync
    const nextState = {
      ...workingState,
      overrides: mergeItemOverrides(workingState.overrides, overrides),
    }
    updateStateLocally(nextState)
    await syncToBackend(nextState)
  }

  // Initial fetch loading state
  if (isLoading) {
    return <ResumeLoadingView />
  }

  return (
    <div
      className="page-container"
      style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {/* Toast notifications — rendered at top-center above all modals */}
      <Toaster
        position="top-center"
        containerStyle={{ zIndex: 99999 }}
        toastOptions={{ style: { zIndex: 99999 } }}
      />

      <div
        className="page-bg-gradient"
        style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
      />

      <div
        className="relative z-10 flex flex-1 min-h-0 gap-6 px-8"
        style={{ paddingTop: "calc(var(--navbar-height, 4rem) + 4rem)", paddingBottom: "1.5rem" }}
      >
        <div className="flex-1 min-w-0 flex flex-col relative" style={{ height: "100%" }}>
          {/* Header bar: back link, title, dirty indicator, mode switch, save/export */}
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
                {/* Shown whenever workingState has unsaved changes */}
                {isDirty && (
                  <span className="text-xs" style={{ color: "var(--ink-fade)" }}>
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-row items-center gap-4">
              <div className="flex flex-row items-center justify-center gap-2">
                {/* Toggle between Manual and AI Tailor editing modes */}
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

                {/* Saves a named version snapshot of the current resume state */}
                <SaveResumeButton
                  workingState={workingState}
                  parentVersionId={parentVersionId}
                  syncToBackend={syncToBackend}
                />

                {/* Triggers Typst PDF compilation and downloads the result */}
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

          {/* Scrollable editor body */}
          <div
            className="flex-1 overflow-y-auto pb-8 space-y-6"
            style={{ scrollbarGutter: "stable" }}
          >
            {/* Hint banner shown while any drag-and-drop operation is active */}
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

            {/* AI Tailoring Studio — only visible in AI mode */}
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

            {/* Empty state when the user has no career history items yet */}
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
              // Render one draggable section card per section type
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
                        // Manual mode: open the EditOverrideModal for this item
                        setEditingItem(item)
                        return
                      }
                      // AI mode: require the item to be selected before opening the modal
                      if (!isSelected(item.id)) {
                        toast("Select this item first to include it in AI tailoring.")
                        return
                      }
                      // Open AI tailor modal targeting this single item
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
                      // Section-level AI tailor: only runs in AI mode
                      if (editMode !== "ai") return
                      // Filter down to only the items the user has selected
                      const selectedItems = sectionToTailor.items.filter((item) =>
                        isSelected(item.id)
                      )
                      if (selectedItems.length === 0) {
                        toast("Select at least one item in this section before AI tailoring.")
                        return
                      }
                      // Open AI tailor modal targeting all selected items in this section
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
          <ResumeBuilderToolbar
            isDirty={isDirty}
            editMode={editMode}
            onEditModeChange={(next) =>
              requestModeChange(next, {
                onSwitchToAi: () => setAiStudioExpanded(false),
                onDiscardManual: () => setEditingItem(null),
                onDiscardAi: () => {
                  setAiResetSignal((n) => n + 1)
                  setAiStudioExpanded(false)
                },
              })
            }
            workingState={workingState}
            parentVersionId={parentVersionId}
            syncToBackend={() => syncToBackend()}
            onExportPdf={handleExportPdf}
            exportingPdf={exportingPdf}
          />

          <ResumeEditorPane
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
            onEditOverride={setEditingItem}
            onSetAiTarget={setAiTarget}
            getOverride={getOverride}
            isDragging={isDragging}
            editMode={editMode}
            savedTailoringContext={savedTailoringContext}
            onSaveTailoringContext={handleSaveTailoringContext}
            onTailor={handleTailor}
            tailoring={tailoring}
            aiStudioExpanded={aiStudioExpanded}
            onAiStudioExpandedChange={setAiStudioExpanded}
            onAiDirtyChange={setAiDirty}
            aiResetSignal={aiResetSignal}
          />
        </div>
        <ResumePreviewPane
          versionName={versionName}
          versionSavedAt={versionSavedAt}
          updatedAt={updatedAt}
          selectedTemplateId={selectedTemplateId}
          currentTemplateId={workingState.template_id}
          onTemplateSelect={(id) => {
            void setTemplate(id)
          }}
          formatDateTime={formatDateTime}
          previewSections={previewSections}
          previewProfile={previewProfile}
        />
      </div>

      {/* Manual edit modal for a single item */}
      {editingItem && (
        <EditOverrideModal
          item={editingItem}
          typeName={getTypeName(editingItem.item_type_id)}
          override={getOverride(editingItem.id)}
          onSave={saveOverride}
          onReset={clearOverride}
          onClose={() =>
            requestManualClose(
              () => setEditingItem(null),
              () => setEditingItem(null)
            )
          }
          saving={workingStateSaving}
          onDirtyChange={setManualDirty}
        />
      )}

      <UnsavedChangesModal
        open={showUnsavedPrompt}
        onStay={stayWithChanges}
        onDiscard={discardAndContinue}
      />

      {/* AI tailor modal for selected item(s) */}
      {aiTarget && (
        <AIItemTailorModal
          title={aiTarget.title}
          subtitle={aiTarget.subtitle}
          context={savedTailoringContext} // Passes saved job description / audience context
          items={aiTarget.items}
          onApply={applyAiItemTweaks} // Merges AI output into working state on confirm
          onClose={() => setAiTarget(null)}
        />
      )}
    </div>
  )
}
