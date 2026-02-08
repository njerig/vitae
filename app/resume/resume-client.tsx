"use client"

import Link from "next/link"
import { useCanon } from "@/lib/canon/useCanon"
import { useState, useEffect, useCallback } from "react"
import { DragSection } from "../_components/resume/DragSection"
import { DragItem } from "../_components/resume/DragItem"
import { Spinner } from "@/lib/components/Spinner"
import { PageHeader } from "@/lib/components/PageHeader"
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

export default function ResumeClient({ userName, userId }: { userName: string; userId: string }) {
  const { allItems, itemTypes, loading, patch } = useCanon()
  const [sections, setSections] = useState<any[]>([])
  const [draggedItem, setDraggedItem] = useState<any>(null)
  const [draggedSection, setDraggedSection] = useState<number | null>(null)
  const { isSelected, toggleItem } = useWorkingState()

  useEffect(() => {
    const grouped = itemTypes
      .map((type) => ({
        typeName: type.display_name,
        typeId: type.id,
        items: allItems
          .filter((item) => item.item_type_id === type.id)
          .sort((a, b) => a.position - b.position),
      }))
      .filter(section => section.items.length > 0)

    setSections(grouped)
  }, [allItems, itemTypes])

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
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Resume Preview */}
            <div className="lg:sticky lg:top-32 h-fit">
              <div className="bg-white rounded-2xl border p-8 shadow-sm min-h-[600px]" style={{
                borderColor: "var(--grid)"
              }}>
                <h3 className="text-2xl font-semibold mb-6 pb-4 border-b" style={{
                  color: "var(--ink)",
                  fontFamily: "var(--font-serif)",
                  borderColor: "var(--grid)"
                }}>Resume Preview</h3>

                {/* Show selected items */}
                {sections.map((section) => {
                  // Filter only selected items in this section
                  const selectedItems = section.items.filter((item: any) => isSelected(item.id))

                  if (selectedItems.length === 0) return null

                  return (
                    <div key={section.typeId} className="mb-6">
                      <h4 className="text-lg font-semibold mb-3" style={{
                        color: "var(--ink)",
                        fontFamily: "var(--font-serif)"
                      }}>{section.typeName}</h4>

                      <div className="space-y-4">
                        {selectedItems.map((item: any) => {
                          const content = (item.content ?? {}) as Record<string, unknown>

                          // Render based on section type
                          if (section.typeName === "Work Experience") {
                            return (
                              <div key={item.id} className="pl-4 border-l-2" style={{ borderColor: "var(--accent)" }}>
                                <div className="font-medium" style={{ color: "var(--ink)" }}>
                                  {String(content.role || "")}
                                </div>
                                <div className="text-sm" style={{ color: "var(--ink-fade)" }}>
                                  {String(content.org || "")}
                                </div>
                                <div className="text-xs mt-1" style={{ color: "var(--ink-light)" }}>
                                  {content.start ? formatDate(String(content.start)) : ""} → {content.end ? formatDate(String(content.end)) : "Present"}
                                </div>
                                {Array.isArray(content.bullets) && content.bullets.length > 0 && (
                                  <ul className="mt-2 text-sm space-y-1">
                                    {content.bullets.map((bullet: string, idx: number) => (
                                      <li key={idx} className="flex items-start">
                                        <span className="mr-2" style={{ color: "var(--ink-light)" }}>•</span>
                                        <span style={{ color: "var(--ink)" }}>{bullet}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                                {Array.isArray(content.skills) && content.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {content.skills.map((skill: string, idx: number) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 text-xs rounded-full"
                                        style={{
                                          backgroundColor: "var(--accent)",
                                          color: "var(--paper)"
                                        }}
                                      >{skill}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          }

                          // Add other section types here if needed
                          return (
                            <div key={item.id} className="pl-4 border-l-2" style={{ borderColor: "var(--accent)" }}>
                              <div className="font-medium" style={{ color: "var(--ink)" }}>
                                {item.title || "Untitled"}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Show message if nothing selected */}
                {sections.every((section) =>
                  section.items.filter((item: any) => isSelected(item.id)).length === 0
                ) && (
                    <div className="text-center py-12">
                      <p style={{ color: "var(--ink-fade)" }}>
                        Check items on the left to see them in your resume preview
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}