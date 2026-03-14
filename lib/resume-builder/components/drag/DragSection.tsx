import { useState, useEffect, useRef } from "react"
import { GripVertical } from "./GripVertical"
import { DragItem } from "./DragItem"
import { Sparkles } from "lucide-react"

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
  onTailorSection,
  getOverride,
  itemActionMode,
}: any) {
  const [editingPosition, setEditingPosition] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  // visual indicator do not do setSections during dragover
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null)

  // Stable ref so dragover can read the current dragged section index without needing draggedSection in the array
  const draggedSectionRef = useRef(draggedSection)
  useEffect(() => {
    draggedSectionRef.current = draggedSection
  }, [draggedSection])

  // Clear the drop indicator on any dragend or drop event anywhere on the page, so indicator doesn't get stuck
  useEffect(() => {
    const clear = () => setDropPosition(null)
    window.addEventListener("dragend", clear)
    window.addEventListener("drop", clear)
    return () => {
      window.removeEventListener("dragend", clear)
      window.removeEventListener("drop", clear)
    }
  }, [])

  // Validates that a user-entered position number is within bounds
  const validatePosition = (position: number, max: number) =>
    position >= 1 && position <= max && !isNaN(position)

  // Moves a section from fromIndex to toIndex by splicing the sections array
  const applyMove = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return
    const newSections = [...sections]
    const [removed] = newSections.splice(fromIndex, 1)
    newSections.splice(toIndex, 0, removed)
    setSections(newSections)
  }

  // Handles the numeric position input - converts 1-based user input to 0-based index
  const handleSectionPositionChange = (newPosition: number) => {
    if (!validatePosition(newPosition, sections.length)) return
    applyMove(sectionIndex, newPosition - 1)
    setEditingKey(null)
  }

  // Switches the position input to editing mode, pre-filling with the current position
  const handlePositionFocus = (key: string, currentValue: number) => {
    setEditingKey(key)
    setEditingPosition(String(currentValue))
  }

  // Exits editing mode and clears the local editing buffer
  const handlePositionBlur = () => {
    setEditingKey(null)
    setEditingPosition("")
  }

  // Determines whether the cursor is in the top or bottom half of the target element,
  // used to decide whether to insert above or below
  const getDropHalf = (e: React.DragEvent): "above" | "below" => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    return e.clientY < rect.top + rect.height / 2 ? "above" : "below"
  }

  // Show the drop indicator - Ignores item drags so they don't interfere with section drag logic.
  const handleSectionDragOver = (e: React.DragEvent) => {
    e.preventDefault()

    // If this is an item drag, let it fall through to DragItem — don't interfere
    if (e.dataTransfer.types.includes("application/drag-type-item")) return

    const current = draggedSectionRef.current
    if (current === null || current === undefined || current === sectionIndex) {
      setDropPosition(null)
      return
    }

    // Only show the indicator = no setSections call here
    setDropPosition(getDropHalf(e))
  }

  // Clears the drop indicator when the cursor leaves this section's bounds
  const handleSectionDragLeave = (e: React.DragEvent) => {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDropPosition(null)
    }
  }

  //  Reorder happens on drop
  const handleSectionDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDropPosition(null)

    // If it's an item drag bubbling up, ignore it
    if (e.dataTransfer.types.includes("application/drag-type-item")) return

    const fromIndex = draggedSectionRef.current
    if (fromIndex === null || fromIndex === undefined || fromIndex === sectionIndex) {
      setDraggedSection(null)
      return
    }

    const half = getDropHalf(e)
    let toIndex = sectionIndex
    if (half === "below") {
      // Dragging down: target index is already shifted, so use it directly
      toIndex = fromIndex < sectionIndex ? sectionIndex : sectionIndex + 1
    } else {
      // Dragging up: target index needs to shift back by one if source was below
      toIndex = fromIndex > sectionIndex ? sectionIndex : sectionIndex - 1
    }

    applyMove(fromIndex, toIndex)
    setDraggedSection(null)
  }

  // Cleans up dragged section state when the drag ends (including cancelled drags)
  const handleSectionDragEnd = () => {
    setDraggedSection(null)
    setDropPosition(null)
  }

  // True while this specific section is the one being dragged
  const isSectionDragging = draggedSection === sectionIndex

  return (
    <div
      className="relative"
      onDragOver={handleSectionDragOver}
      onDragLeave={handleSectionDragLeave}
      onDrop={handleSectionDrop}
    >
      {/* Drop indicator - above */}
      {dropPosition === "above" && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center gap-1"
          style={{ top: "-6px" }}
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </div>
      )}

      {/* Section card - fades and scales slightly while being dragged */}
      <div
        className={`rounded-2xl border shadow-sm transition-all duration-150 ${
          isSectionDragging ? "opacity-40 scale-[0.99]" : "opacity-100"
        }`}
        style={{
          borderColor: isSectionDragging ? "var(--accent)" : "var(--grid)",
          backgroundColor: "var(--paper-dark)",
        }}
      >
        {/* Section header - the only draggable surface for section reorder */}
        <div
          draggable
          onDragStart={(e) => {
            // If the drag originates from an item inside this section, let the item handle it
            if ((e.target as HTMLElement).closest("[data-item-draggable]")) {
              e.preventDefault()
              return
            }
            // Tag this drag as a section drag so DragItem can ignore it
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

          {/* Right-side controls: AI tailor button (AI mode only) and numeric position input.
              stopPropagation on mousedown prevents these clicks from triggering the drag. */}
          <div className="flex items-center gap-2" onMouseDown={(e) => e.stopPropagation()}>
            {/* AI tailor button - only visible in AI mode */}
            {itemActionMode === "ai" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onTailorSection?.(section)
                }}
                className="p-1.5 rounded-md border cursor-pointer"
                style={{
                  borderColor: "var(--grid)",
                  color: "var(--ink-light)",
                  backgroundColor: "var(--paper)",
                }}
                title="Tailor this section with AI"
                aria-label="Tailor this section with AI"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}
            <label className="text-xs" style={{ color: "var(--ink-light)" }}>
              Section order:
            </label>
            {/* Numeric position input - allows manual reordering by typing a position number */}
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

        {/* Items list - each item is independently draggable within this section */}
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
              hasOverride={!!getOverride?.(item.id)}
              itemActionMode={itemActionMode}
            />
          ))}
        </div>
      </div>

      {/* Drop indicator — below */}
      {dropPosition === "below" && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-none flex items-center gap-1"
          style={{ bottom: "-6px" }}
        >
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: "var(--accent)" }}
          />
          <div className="flex-1 h-1 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </div>
      )}
    </div>
  )
}
