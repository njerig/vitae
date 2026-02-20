import { useState } from "react"
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
  saveItemPosition,
  formatDate,
  handleItemDragEnd,
  isSelected,
  toggleItem,
  onEditOverride,
  getOverride
}: any) {
  const [editingPosition, setEditingPosition] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const validatePosition = (position: number, max: number) =>
    position >= 1 && position <= max && !isNaN(position)

  const moveSection = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections]
    const [removed] = newSections.splice(fromIndex, 1)
    newSections.splice(toIndex, 0, removed)
    return newSections
  }

  const handleSectionPositionChange = (newPosition: number) => {
    if (!validatePosition(newPosition, sections.length)) return
    const targetIndex = newPosition - 1
    const newSections = moveSection(sectionIndex, targetIndex)
    setSections(newSections)
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

  const handleSectionDragStart = (e: React.DragEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('[data-item-draggable]')) {
      e.preventDefault()
      return
    }
    setDraggedSection(sectionIndex)
  }

  const handleSectionDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedSection === null || draggedSection === sectionIndex) return
    const newSections = moveSection(draggedSection, sectionIndex)
    setSections(newSections)
    setDraggedSection(sectionIndex)
  }

  const handleSectionDragEnd = () => {
    setDraggedSection(null)
  }

  const isSectionDragging = draggedSection === sectionIndex

  return (
    <div
      draggable
      onDragStart={handleSectionDragStart}
      onDragOver={handleSectionDragOver}
      onDragEnd={handleSectionDragEnd}
      className={`rounded-2xl border shadow-sm transition-all ${isSectionDragging ? "opacity-50" : ""
        }`}
      style={{
        borderColor: "var(--grid)",
        backgroundColor: "var(--paper-dark)"
      }}
    >
      <div
        className="p-6 border-b flex items-center gap-3 cursor-move hover:bg-gray-50 rounded-t-2xl"
        style={{ borderColor: "var(--grid)" }}
      >
        <GripVertical className="w-5 h-5" style={{ color: "var(--ink-light)" }} />
        <div className="flex-1">
          <h3 className="text-xl font-semibold" style={{
            color: "var(--ink)",
            fontFamily: "var(--font-serif)"
          }}>{section.typeName}</h3>
          <p className="text-sm mt-1" style={{ color: "var(--ink-light)" }}>
            {section.items.length} item{section.items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
          <label className="text-xs" style={{ color: "var(--ink-light)" }}>Section order:</label>
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
              if (e.key === 'Enter') {
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
              backgroundColor: "var(--paper)"
            }}
          />
        </div>
      </div>

      <div className="p-6 space-y-4">
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
            saveItemPosition={saveItemPosition}
            formatDate={formatDate}
            handleItemDragEnd={handleItemDragEnd}
            isSelected={isSelected}
            toggleItem={toggleItem}
            onEditOverride={onEditOverride}
            hasOverride={!!getOverride?.(item.id)}
          />
        ))}
      </div>
    </div>
  )
}