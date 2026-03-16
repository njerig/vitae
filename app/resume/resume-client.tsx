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

  const archivedItems = useRestoredArchivedItems(parentVersionId)
  const [aiResetSignal, setAiResetSignal] = useState(0)
  const [aiStudioExpanded, setAiStudioExpanded] = useState(false)
  const [aiTarget, setAiTarget] = useState<AITarget | null>(null)
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

  // -- Render ------------------------------------------------------------------

  if (isLoading) {
    return <ResumeLoadingView />
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
        <div className="flex-1 min-w-0 flex flex-col relative" style={{ height: "100%" }}>
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

      {/* Edit Override Modal */}
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
