"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import toast from "react-hot-toast"
import { useCanon } from "@/lib/canon/useCanon"
import type { CanonItem } from "@/lib/shared/types"
import { useWorkingState } from "@/lib/working-state/useWorkingState"
import { useResumeSections } from "@/lib/resume-builder/useResumeSection"
import { useDragState } from "@/lib/resume-builder/useDragState"
import { compileResumeToPdf } from "@/lib/resume-builder/api"

export function useResumeBuilder(userName: string) {
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

  const filteredSections = useMemo(() => {
    const selectedIds = new Set(workingState.sections.flatMap((s) => s.item_ids))
    if (selectedIds.size === 0) return []
    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => selectedIds.has(item.id)),
      }))
      .filter((section) => section.items.length > 0)
  }, [sections, workingState.sections])

  const previewProfile = useMemo(() => ({ name: userName }), [userName])
  const selectedTemplateId = workingState.template_id ?? "classic"

  const saveItemPosition = useCallback(async () => {}, [])

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
  } = useDragState(sections, saveItemPosition)

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
  }
}
