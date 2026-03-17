"use client"

import toast from "react-hot-toast"
import { DragSection } from "@/lib/resume-builder/components/drag/DragSection"
import { TailoringStudioCard } from "@/lib/resume-builder/tailor/ai/components/TailoringStudioCard"
import type { CanonItem } from "@/lib/shared/types"
import type { TailoringAxes } from "@/lib/resume-builder/tailor/options"

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

type TailoringContextSavePayload = {
  contextType: "job_description" | "audience"
  contextText: string
  contextTexts: {
    job_description: string
    audience: string
  }
  axes: TailoringAxes
}

type ResumeEditorPaneProps = {
  sections: {
    typeName: string
    typeId: string
    items: CanonItem[]
  }[]
  setSections: (sections: { typeName: string; typeId: string; items: CanonItem[] }[]) => void
  draggedSection: number | null
  setDraggedSection: (idx: number | null) => void
  draggedItem: { sectionIndex: number; itemIndex: number } | null
  setDraggedItem: (value: { sectionIndex: number; itemIndex: number } | null) => void
  isSelected: (itemId: string) => boolean
  toggleItem: (itemId: string, itemTypeId: string) => void
  onEditOverride: (item: CanonItem<unknown>) => void
  onSetAiTarget: (target: AITarget) => void
  getOverride: (itemId: string) => { title?: string; content?: Record<string, unknown> } | undefined
  handleItemDragEnd: () => void
  formatDate: (date: string) => string
  isDragging: boolean
  editMode: "manual" | "ai"
  savedTailoringContext?: {
    context_type: "job_description" | "audience"
    context_text: string
    context_text_by_type?: { job_description?: string; audience?: string }
    axes?: TailoringAxes
  }
  onSaveTailoringContext: (payload: TailoringContextSavePayload) => Promise<void>
  onTailor: (payload: {
    contextType: "job_description" | "audience"
    contextText: string
    axes: TailoringAxes
  }) => Promise<void>
  tailoring: boolean
  aiStudioExpanded: boolean
  onAiStudioExpandedChange: (expanded: boolean) => void
  onAiDirtyChange: (dirty: boolean) => void
  aiResetSignal: number
}

export function ResumeEditorPane({
  sections,
  setSections,
  draggedSection,
  setDraggedSection,
  draggedItem,
  setDraggedItem,
  isSelected,
  toggleItem,
  onEditOverride,
  onSetAiTarget,
  getOverride,
  handleItemDragEnd,
  formatDate,
  isDragging,
  editMode,
  savedTailoringContext,
  onSaveTailoringContext,
  onTailor,
  tailoring,
  aiStudioExpanded,
  onAiStudioExpandedChange,
  onAiDirtyChange,
  aiResetSignal,
}: ResumeEditorPaneProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col relative" style={{ height: "100%" }}>
      <div className="flex-1 overflow-y-auto pb-8 space-y-6" style={{ scrollbarGutter: "stable" }}>
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
            onSaveContext={onSaveTailoringContext}
            onTailor={onTailor}
            tailoring={tailoring}
            expanded={aiStudioExpanded}
            onExpandedChange={onAiStudioExpandedChange}
            onDirtyChange={onAiDirtyChange}
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
                    onEditOverride(item)
                    return
                  }
                  if (!isSelected(item.id)) {
                    toast("Select this item first to include it in AI tailoring.")
                    return
                  }
                  onSetAiTarget({
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
                onTailorSection={(sectionToTailor: { typeName: string; items: CanonItem[] }) => {
                  if (editMode !== "ai") return
                  const selectedItems = sectionToTailor.items.filter((item) => isSelected(item.id))
                  if (selectedItems.length === 0) {
                    toast("Select at least one item in this section before AI tailoring.")
                    return
                  }
                  onSetAiTarget({
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
  )
}
