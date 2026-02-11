"use client"

import Link from "next/link"
import { useCanon } from "@/lib/canon/useCanon"
import { useState, useMemo, useCallback } from "react"
import { DragSection } from "../_components/resume/DragSection"
import { Spinner } from "@/lib/components/Spinner"
import { PageHeader } from "@/lib/components/PageHeader"
import { ResumePreview } from "./ResumePreview"
import type { CanonItem, ItemType } from "@/lib/types"
import { useWorkingState } from "@/lib/working-state/useWorkingState"

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
  const [sections, setSections] = useState<any[]>([])
  const [draggedItem, setDraggedItem] = useState<any>(null)
  const [draggedSection, setDraggedSection] = useState<number | null>(null)
  const { isSelected, toggleItem } = useWorkingState()

  useEffect(() => {
    const grouped = itemTypes
  const computedSections = useMemo<Array<{ typeName: string; typeId: string; items: CanonItem[] }>>(() => {
    return (itemTypes as ItemType[])
      .map((type) => ({
        typeName: type.display_name,
        typeId: type.id,
        items: (allItems as CanonItem[])
          .filter((item) => item.item_type_id === type.id)
          .sort((a, b) => a.position - b.position),
      }))
      .filter(section => section.items.length > 0)

    setSections(grouped)
  }, [allItems, itemTypes])
  const [localSections, setLocalSections] = useState<Array<{ typeName: string; typeId: string; items: CanonItem[] }> | null>(null)
  const sections = localSections ?? computedSections
  const [draggedItem, setDraggedItem] = useState<{ sectionIndex: number; itemIndex: number } | null>(null)
  const [draggedSection, setDraggedSection] = useState<number | null>(null)

  const setSectionsLocal = useCallback(
    (next: Array<{ typeName: string; typeId: string; items: CanonItem[] }>) => {
      setLocalSections(next)
    },
    []
  )

  const saveItemPosition = useCallback(async (itemId: string, position: number) => {
    try {
      await patch(itemId, { position })
    } catch (error) {
      console.error("Failed to save item position:", error)
    }
  }, [patch])

  const handleItemDragEnd = () => {
    if (draggedItem) {
      const { sectionIndex } = draggedItem
      const section = sections[sectionIndex]

      section.items.forEach((item: any, index: number) => {
        if (item.position !== index) {
          saveItemPosition(item.id, index)
        }
      })
    }

    setDraggedItem(null)
  }

  if (loading) {
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
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Resume Builder */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <PageHeader
                  title="Resume Builder"
                  subtitle="Drag to reorder sections and items"
                  actions={
                    <Link href="/home">
                      <button className="btn-secondary rounded-lg flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Career History
                      </button>
                    </Link>
                  }
                />
              </div>

              {(draggedItem !== null || draggedSection !== null) && (
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
                      setSections={setSectionsLocal}
                      draggedSection={draggedSection}
                      setDraggedSection={setDraggedSection}
                      draggedItem={draggedItem}
                      setDraggedItem={setDraggedItem}
                      saveItemPosition={saveItemPosition}
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
                  }}>Resume Preview</h3>
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