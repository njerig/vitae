"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import toast from "react-hot-toast"
import { useCanon } from "@/lib/canon/useCanon"
import type { ArchivedCanonItem, CanonItem } from "@/lib/shared/types"
import { useWorkingState } from "@/lib/working-state/useWorkingState"
import { useResumeSections } from "@/lib/resume-builder/useResumeSection"
import { useDragState } from "@/lib/resume-builder/useDragState"
import { compileResumeToPdf } from "@/lib/resume-builder/api"

// archivedItems — items the user has deleted but are still referenced by the restored
// version snapshot. They are merged into the preview item pool so the preview renders
// correctly, but they are NOT added to the live canon list shown in the left column.
export function useResumeBuilder(userName: string, archivedItems: ArchivedCanonItem[] = []) {
  const { allItems, itemTypes, loading } = useCanon()
  const [editingItem, setEditingItem] = useState<CanonItem<unknown> | null>(null)

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
    getOverride,
    saveOverride,
    clearOverride,
    setTemplate,
    setTailoringContext,
  } = useWorkingState()

  const getTypeName = useCallback(
    (typeId: string) => itemTypes.find((t) => t.id === typeId)?.display_name ?? "Unknown",
    [itemTypes]
  )

  const { sections, setSections } = useResumeSections(
    allItems,
    itemTypes,
    workingState,
    workingStateLoading,
    updateStateLocally
  )

  // Merge live canon items with archived items so the preview can render deleted ones.
  // Archived items that share an ID with a live item are ignored (shouldn't happen,
  // but ensures live data always wins).
  const liveItemIds = useMemo(() => new Set(allItems.map((i) => i.id)), [allItems])
  const allItemsWithArchived = useMemo<CanonItem[]>(
    () => [
      ...allItems,
      // Cast ArchivedCanonItem to CanonItem — the extra deleted_at field is harmless
      ...(archivedItems.filter((a) => !liveItemIds.has(a.id)) as CanonItem[]),
    ],
    [allItems, archivedItems, liveItemIds]
  )

  const filteredSections = useMemo(() => {
    // Build a fast item lookup across live + archived items
    const itemById = new Map(allItemsWithArchived.map((item) => [item.id, item]))

    // Build type name lookup for archived items whose type may not be in `sections`
    const typeNameById = new Map(itemTypes.map((t) => [t.id, t.display_name]))

    // Use workingState.sections as the canonical order, it is updated on every
    // drag-to-reorder so the preview always reflects the user's chosen section/item order.
    // For each section in the working state, resolve item IDs to actual item objects
    // (including archived ones). Sections with no resolvable items are dropped.
    return workingState.sections
      .map((s) => {
        const items = s.item_ids
          .map((id) => {
            const item = itemById.get(id)
            if (!item) return null

            // check if there any overrides
            const override = workingState.overrides?.[id]
            if (!override) return item

            // if there are overrides, then apply them
            return {
              ...item,
              title: override.title ?? item.title,
              content: override.content
                ? { ...(item.content as Record<string, unknown>), ...override.content }
                : item.content,
            }
          })
          .filter(Boolean) as CanonItem[]

        return {
          typeName: typeNameById.get(s.item_type_id) ?? "Unknown",
          typeId: s.item_type_id,
          items,
        }
      })
      .filter((section) => section.items.length > 0)
  }, [allItemsWithArchived, itemTypes, workingState.sections, workingState.overrides])

  const previewProfile = useMemo(() => ({ name: userName }), [userName])
  const selectedTemplateId = workingState.template_id ?? "classic"

  const [exportingPdf, setExportingPdf] = useState(false)
  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true)
    try {
      const data = {
        profile: previewProfile,
        sections: filteredSections.length > 0 ? filteredSections : sections,
      }
      const blob = await compileResumeToPdf(data, selectedTemplateId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "resume.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error("PDF export error:", e)
      toast.error("PDF export failed")
    } finally {
      setExportingPdf(false)
    }
  }, [previewProfile, filteredSections, sections, selectedTemplateId])

  const {
    draggedItem,
    setDraggedItem,
    draggedSection,
    setDraggedSection,
    handleItemDragEnd,
    isDragging,
  } = useDragState(sections)

  const savingToastId = useRef<string | null>(null)

  useEffect(() => {
    if (workingStateSaving) {
      if (!savingToastId.current) {
        savingToastId.current = toast.loading("Saving...", { position: "top-center" })
      }
    } else if (savingToastId.current) {
      toast.dismiss(savingToastId.current)
      savingToastId.current = null
    }
  }, [workingStateSaving])

  const isLoading = loading || workingStateLoading
  const previewSections = filteredSections.length > 0 ? filteredSections : sections

  return {
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
  }
}
