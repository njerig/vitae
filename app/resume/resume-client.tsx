"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import toast, { Toaster } from "react-hot-toast"
import { DragSection } from "../../lib/resume-builder/components/drag/DragSection"
import { Spinner } from "@/lib/shared/components/Spinner"
import { SegmentedSwitch } from "@/lib/shared/components/SegmentedSwitch"
import { SaveResumeButton } from "@/lib/versions/components/save/SaveResumeButton"
import { ChevronLeft, Download } from "lucide-react"
import { ResumeBuilderPreview } from "@/lib/resume-builder/components/ResumeBuilderPreview"
import { TemplateSelectorButton } from "@/lib/resume-builder/components/TemplateSelectorButton"
import { EditOverrideModal } from "@/lib/resume-builder/components/edit/EditOverrideModal"
import { TailoringStudioCard } from "@/lib/tailor/components/TailoringStudioCard"
import { AIItemTailorModal } from "@/lib/tailor/components/AIItemTailorModal"
import { useTailorPrioritization } from "@/lib/tailor/useTailorPrioritization"
import type { ArchivedCanonItem, CanonItem } from "@/lib/shared/types"
import type { TailoringAxes } from "@/lib/tailor/options"
import { formatDateTime, formatDate } from "@/lib/shared/utils"
import { useResumeBuilder } from "@/lib/resume-builder/useResumeBuilder"

// -- Types ---------------------------------------------------------------------

// Represents a single resume item being targeted by the AI tailor modal
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

// -- Helpers -------------------------------------------------------------------

/**
 * Reads archived canon items restored for a specific parent version.
 * When restoring an old version, useVersion writes the archived items to
 * sessionStorage so this component can pick them up on mount without
 * re-fetching from the backend.
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
    // Always clear the key after reading — it's a one-time handoff
    sessionStorage.removeItem(key)
  }
}

/**
 * Merges AI bullet overrides into an existing override dictionary.
 * Preserves any manually set title or content fields that the AI didn't touch.
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

/**
 * Resume builder page client component.
 * Owns the editing mode toggle (manual vs AI tailor), drag-and-drop sections,
 * resume preview, and all modals (edit override, AI tailor, unsaved-changes prompt).
 *
 * @param props.userName - Display name shown in greetings/headers.
 * @param props.versionName - Label of the active saved version, if restoring one.
 * @param props.versionSavedAt - Save timestamp of the active version.
 * @param props.parentVersionId - ID of the version being restored; used to
 *   retrieve archived items from sessionStorage on mount.
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

  // Archived items from a restored version — populated from sessionStorage on mount
  const [archivedItems, setArchivedItems] = useState<ArchivedCanonItem[]>([])

  // Which editing mode the user is in: dragging/manual edits vs AI tailoring
  const [editMode, setEditMode] = useState<"manual" | "ai">("manual")

  // Dirty flags track whether either mode has unapplied changes that would be
  // lost if the user switches modes or closes a modal without saving
  const [manualDirty, setManualDirty] = useState(false)
  const [aiDirty, setAiDirty] = useState(false)

  // Incrementing this signal tells TailoringStudioCard to reset its local state
  const [aiResetSignal, setAiResetSignal] = useState(0)

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

  // -- Data Hooks --------------------------------------------------------------

  // Central hook that manages working state, section data, drag-and-drop,
  // override CRUD, template selection, PDF export, and backend sync
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

  // Manages AI tailoring slider axes and the tailor action that reorders sections/items
  const { tailoring, handleTailor } = useTailorPrioritization(
    sections,
    setSections,
    workingState,
    updateStateLocally
  )

  // Snapshot of saved tailoring context used to pre-populate the studio card
  const savedTailoringContext = workingState.tailoring_context

  // -- Event Handlers ----------------------------------------------------------

  /**
   * Persists global tailoring context and slider values.
   * Called by TailoringStudioCard when the user clicks "Save context."
   *
   * @param payload - Context values from Tailoring Studio.
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
   * Merges incoming overrides with any existing ones so prior manual edits are preserved.
   *
   * @param overrides - Item-level bullet overrides generated by AI.
   */
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

  // -- Transition Guards -------------------------------------------------------

  /**
   * Generic guard for any action that could discard unsaved edits.
   * If either dirty flag is set, stores the intended action and shows the
   * "Unapplied changes" confirmation modal instead of running it immediately.
   *
   * @param nextAction - Action to run if no unsaved changes, or after "Discard."
   * @param discardCurrentContext - Cleanup to run when the user chooses "Discard."
   */
  const requestTransition = (nextAction: () => void, discardCurrentContext: () => void) => {
    const hasUnappliedChanges = editMode === "manual" ? manualDirty : aiDirty
    if (!hasUnappliedChanges) {
      // No unsaved changes — proceed immediately
      nextAction()
      return
    }
    // Store the deferred action and show the confirmation modal
    setPendingTransition(() => () => {
      discardCurrentContext()
      nextAction()
    })
    setShowUnsavedPrompt(true)
  }

  /**
   * Requests switching between manual and AI modes with unsaved-change protection.
   * Resets the outgoing mode's state if the user confirms "Discard."
   *
   * @param targetMode - Requested editing mode.
   */
  const requestModeChange = (targetMode: "manual" | "ai") => {
    if (targetMode === editMode) return
    requestTransition(
      () => {
        setEditMode(targetMode)
        // Collapse the AI studio when switching into AI mode so the user sees
        // the section list first rather than jumping straight into the panel
        if (targetMode === "ai") setAiStudioExpanded(false)
      },
      () => {
        // Clean up the mode we're leaving
        if (editMode === "manual") {
          setEditingItem(null)
          setManualDirty(false)
        } else {
          setAiDirty(false)
          setAiResetSignal((n) => n + 1) // Signal TailoringStudioCard to reset
          setAiStudioExpanded(false)
        }
      }
    )
  }

  /**
   * Requests closing the manual EditOverrideModal with unsaved-change protection.
   * If dirty, shows the confirmation modal before dismissing.
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

  // Show a centered spinner while the initial resume data loads
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
    // Full viewport height — no page-level scroll; each column handles its own overflow
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

      {/* Fixed decorative background gradient (non-interactive) */}
      <div
        className="page-bg-gradient"
        style={{ position: "fixed", inset: 0, pointerEvents: "none" }}
      />

      {/* Two-column layout — left: editor, right: preview. Both scroll independently. */}
      <div
        className="relative z-10 flex flex-1 min-h-0 gap-6 px-8"
        style={{ paddingTop: "calc(var(--navbar-height, 4rem) + 4rem)", paddingBottom: "1.5rem" }}
      >
        {/* Left column — editor panel */}
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
        </div>

        {/* Right column — resume preview (fixed height, internal scroll) */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div
            className="bg-white rounded-2xl border shadow-sm flex flex-col flex-1 overflow-hidden"
            style={{ borderColor: "var(--grid)" }}
          >
            {/* Preview header: title, template picker, version/timestamp info */}
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
                {/* Left: section label */}
                <h3
                  className="text-2xl font-semibold"
                  style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
                >
                  Resume Preview
                </h3>

                {/* Center: template picker dropdown */}
                <TemplateSelectorButton
                  selectedTemplateId={workingState.template_id ?? "classic"}
                  onSelect={(id) => {
                    void setTemplate(id)
                  }}
                />

                {/* Right: version name and last-updated timestamp (if available) */}
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

            {/* Preview body — renders the live Typst-backed resume preview */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
              <div className="rounded-b-2xl overflow-clip">
                <ResumeBuilderPreview
                  sections={previewSections} // Overrides already applied
                  profile={previewProfile}
                  selectedTemplate={selectedTemplateId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Edit Override Modal — opens when user clicks edit on an item in manual mode */}
      {editingItem && (
        <EditOverrideModal
          item={editingItem}
          typeName={getTypeName(editingItem.item_type_id)}
          override={getOverride(editingItem.id)}
          onSave={saveOverride}
          onReset={clearOverride}
          onClose={requestManualClose} // Uses guarded close to catch unsaved changes
          saving={workingStateSaving}
          onDirtyChange={setManualDirty}
        />
      )}

      {/* Unsaved Changes Confirmation Modal — shown when transitioning away from dirty state */}
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
              {/* Stay: dismiss modal and cancel the pending transition */}
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
              {/* Discard: run the pending transition, discarding unsaved edits */}
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

      {/* AI Item Tailor Modal — opens when a user targets an item or section in AI mode */}
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
