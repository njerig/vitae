import { useState, useEffect, useRef } from "react"
import { GripVertical } from "./GripVertical"
import { DragItem } from "./DragItem"

export function DragSection({
  section,
  sectionIndex,
  sections,
  setSections,
  draggedSection,
  setDraggedSection,
  draggedItem,
  setDraggedItem,
  formatDate,
  handleItemDragEnd,
  isSelected,
  toggleItem,
  onEditOverride,
  onSaveOverride,
  getOverride,
}: any) {
  const [editingPosition, setEditingPosition] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null)

  const draggedSectionRef = useRef(draggedSection)
  useEffect(() => {
    draggedSectionRef.current = draggedSection
  }, [draggedSection])

  useEffect(() => {
    const clear = () => setDropPosition(null)
    window.addEventListener("dragend", clear)
    window.addEventListener("drop", clear)
    return () => {
      window.removeEventListener("dragend", clear)
      window.removeEventListener("drop", clear)
    }
  }, [])

  const validatePosition = (position: number, max: number) =>
    position >= 1 && position <= max && !isNaN(position)

  const applyMove = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    const newSections = [...sections]
    const [removed] = newSections.splice(fromIndex, 1)
    newSections.splice(toIndex, 0, removed)
    setSections(newSections)
  }

  const handleSectionPositionChange = (newPosition: number) => {
    if (!validatePosition(newPosition, sections.length)) return
    applyMove(sectionIndex, newPosition - 1)
    setEditingKey(null)
  }

  const handlePositionFocus = (key: string, currentValue: number) => {
    setEditingKey(key)
    setEditingPosition(String(currentValue))
  }

  const handlePositionBlur = () => {
    setEditingKey(null)
    setEditingPosition("")
  }

  const getDropHalf = (e: React.DragEvent): "above" | "below" => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return e.clientY < rect.top + rect.height / 2 ? "above" : "below"
  }

  const handleSectionDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.types.includes("application/drag-type-item")) return
    const current = draggedSectionRef.current
    if (current === null || current === undefined || current === sectionIndex) {
      setDropPosition(null)
      return
    }
    setDropPosition(getDropHalf(e))
  }

  const handleSectionDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDropPosition(null)
    }
  }

  const handleSectionDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDropPosition(null)
    if (e.dataTransfer.types.includes("application/drag-type-item")) return
    const fromIndex = draggedSectionRef.current
    if (fromIndex === null || fromIndex === undefined || fromIndex === sectionIndex) {
      setDraggedSection(null)
      return
    }
    const half = getDropHalf(e)
    let toIndex = sectionIndex
    if (half === "below") {
      toIndex = fromIndex < sectionIndex ? sectionIndex : sectionIndex + 1
    } else {
      toIndex = fromIndex > sectionIndex ? sectionIndex : sectionIndex - 1
    }
    applyMove(fromIndex, toIndex)
    setDraggedSection(null)
  }

  const handleSectionDragEnd = () => {
    setDraggedSection(null)
    setDropPosition(null)
  }

  const isSectionDragging = draggedSection === sectionIndex

  return (
    <div
      className="relative"
      onDragOver={handleSectionDragOver}
      onDragLeave={handleSectionDragLeave}
      onDrop={handleSectionDrop}
    >
      {dropPosition === "above" && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center gap-1"
          style={{ top: "-6px" }}
        >
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: "var(--accent)" }} />
          <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </div>
      )}

      <div
        className={`rounded-2xl border shadow-sm transition-all duration-150 ${isSectionDragging ? "opacity-40 scale-[0.99]" : "opacity-100"
          }`}
        style={{
          borderColor: isSectionDragging ? "var(--accent)" : "var(--grid)",
          backgroundColor: "var(--paper-dark)",
        }}
      >
        <div
          draggable
          onDragStart={(e) => {
            if ((e.target as HTMLElement).closest("[data-item-draggable]")) {
              e.preventDefault()
              return
            }
            e.dataTransfer.setData("application/drag-type-section", "true")
            e.dataTransfer.effectAllowed = "move"
            setDraggedSection(sectionIndex)
          }}
          onDragEnd={handleSectionDragEnd}
          className="p-6 border-b flex items-center gap-3 rounded-t-2xl cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors select-none"
          style={{ borderColor: "var(--grid)" }}
        >
          <div className="shrink-0">
            <GripVertical className="w-5 h-5" style={{ color: "var(--ink-light)" }} />
          </div>
          <div className="flex-1">
            <h3
              className="text-xl font-semibold"
              style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
            >
              {section.typeName}
            </h3>
            <p className="text-sm mt-1" style={{ color: "var(--ink-light)" }}>
              {section.items.length} item{section.items.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
            <label className="text-xs" style={{ color: "var(--ink-light)" }}>
              Section order:
            </label>
            <input
              type="text"
              value={editingKey === `section-${sectionIndex}` ? editingPosition : sectionIndex + 1}
              onFocus={() => handlePositionFocus(`section-${sectionIndex}`, sectionIndex + 1)}
              onChange={(e) => setEditingPosition(e.target.value)}
              onBlur={(e) => {
                handlePositionBlur()
                const val = parseInt(e.target.value)
                if (!isNaN(val)) handleSectionPositionChange(val)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const val = parseInt(editingPosition)
                  if (!isNaN(val)) handleSectionPositionChange(val)
                  e.currentTarget.blur()
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onDragStart={(e) => e.preventDefault()}
              draggable={false}
              className="w-16 px-2 py-1 text-sm border rounded text-center focus:outline-none cursor-text"
              style={{
                borderColor: "var(--grid)",
                color: "var(--ink)",
                backgroundColor: "var(--paper)",
              }}
            />
          </div>
        </div>

        <div className="p-6 space-y-3">
          {section.items.map((item: any, itemIndex: number) => (
            <DragItem
              key={item.id}
              item={item}
              section={section}
              sectionIndex={sectionIndex}
              itemIndex={itemIndex}
              sections={sections}
              setSections={setSections}
              draggedItem={draggedItem}
              setDraggedItem={setDraggedItem}
              formatDate={formatDate}
              handleItemDragEnd={handleItemDragEnd}
              isSelected={isSelected}
              toggleItem={toggleItem}
              onEditOverride={onEditOverride}
              onSaveOverride={onSaveOverride}
              hasOverride={!!getOverride?.(item.id)}
            />
          ))}
        </div>
      </div>

      {dropPosition === "below" && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center gap-1"
          style={{ bottom: "-6px" }}
        >
          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: "var(--accent)" }} />
          <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </div>
      )}
    </div>
  )
}