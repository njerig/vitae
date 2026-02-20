import { useState, useEffect, useRef } from "react"
import { GripVertical } from "./GripVertical"

export function DragItem({
  item,
  section,
  sectionIndex,
  itemIndex,
  sections,
  setSections,
  draggedItem,
  setDraggedItem,
  saveItemPosition,
  formatDate,
  handleItemDragEnd,
  isSelected,
  toggleItem
}: any) {
  const [editingPosition, setEditingPosition] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<"above" | "below" | null>(null)

  // Ref-based drag state so dragover handler always sees current values without
  // causing re-renders on every mousemove
  const draggedItemRef = useRef(draggedItem)
  draggedItemRef.current = draggedItem

  // Throttle: only reorder once we've moved to a clearly different half
  const lastMoveRef = useRef<{ fromIndex: number; toIndex: number } | null>(null)

  // Clear indicator on any global drag end / drop
  useEffect(() => {
    const clear = () => setDropPosition(null)
    window.addEventListener("dragend", clear)
    window.addEventListener("drop", clear)
    return () => {
      window.removeEventListener("dragend", clear)
      window.removeEventListener("drop", clear)
    }
  }, [])

  const content = (item.content ?? {}) as Record<string, unknown>
  const isItemDragging =
    draggedItem?.sectionIndex === sectionIndex && draggedItem?.itemIndex === itemIndex

  const validatePosition = (position: number, max: number) =>
    position >= 1 && position <= max && !isNaN(position)

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newSections = sections.map((s: any, i: number) =>
      i === sectionIndex ? { ...s, items: [...s.items] } : s
    )
    const [removed] = newSections[sectionIndex].items.splice(fromIndex, 1)
    newSections[sectionIndex].items.splice(toIndex, 0, removed)
    return newSections
  }

  const handleItemPositionChange = (newPosition: number) => {
    if (!validatePosition(newPosition, section.items.length)) return
    const targetIndex = newPosition - 1
    const newSections = moveItem(itemIndex, targetIndex)
    setSections(newSections)
    setEditingKey(null)
    saveItemPosition(item.id, targetIndex)
  }

  const handlePositionFocus = (key: string, currentValue: number) => {
    setEditingKey(key)
    setEditingPosition(String(currentValue))
  }

  const handlePositionBlur = () => {
    setEditingKey(null)
    setEditingPosition("")
  }

  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Ignore if this is a section drag
    if (e.dataTransfer.types.includes("application/drag-type-section")) return

    const current = draggedItemRef.current
    if (!current || current.sectionIndex !== sectionIndex) {
      setDropPosition(null)
      return
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const isAbove = e.clientY < rect.top + rect.height / 2
    const newDropPos = isAbove ? "above" : "below"
    setDropPosition(current.itemIndex === itemIndex ? null : newDropPos)

    // Only call setSections when the target slot actually changes — prevents
    // the 60fps state-thrashing that made dragging feel broken
    if (current.itemIndex !== itemIndex) {
      const last = lastMoveRef.current
      if (last?.fromIndex === current.itemIndex && last?.toIndex === itemIndex) return
      lastMoveRef.current = { fromIndex: current.itemIndex, toIndex: itemIndex }
      const newSections = moveItem(current.itemIndex, itemIndex)
      setSections(newSections)
      setDraggedItem({ sectionIndex, itemIndex })
    }
  }

  const handleItemDragLeave = (e: React.DragEvent) => {
    // Only clear if we're truly leaving this element (not entering a child)
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      setDropPosition(null)
    }
  }

  const handleLocalDragEnd = (e: React.DragEvent) => {
    setDropPosition(null)
    lastMoveRef.current = null
    handleItemDragEnd(e)
  }

  const extractItemContent = (sectionName: string, content: Record<string, unknown>, item: any) => {
    const result = {
      title: "",
      subtitle: "",
      dateString: "",
      description: "",
      bullets: [] as string[],
      skills: [] as string[],
      location: "",
      technologies: [] as string[]
    }

    if (sectionName === "Work Experience") {
      result.title = String(content.role || "")
      result.subtitle = String(content.org || "")
      const startDate = content.start ? formatDate(String(content.start)) : ""
      const endDate = content.end ? formatDate(String(content.end)) : ""
      result.dateString = startDate ? `${startDate} → ${endDate || "Present"}` : ""
      result.bullets = Array.isArray(content.bullets) ? content.bullets as string[] : []
      result.skills = Array.isArray(content.skills) ? content.skills as string[] : []
      result.technologies = result.skills
    } else if (sectionName === "Education") {
      result.title = String(content.institution || content.school || "")
      result.subtitle = String(content.degree || content.field || "")
      result.location = String(content.location || "")
      const startDate = content.start || content.start_date || content.startDate
      const endDate = content.end || content.end_date || content.endDate || content.graduation_date
      if (startDate) {
        const formattedStart = formatDate(String(startDate))
        const formattedEnd = endDate ? formatDate(String(endDate)) : "Present"
        result.dateString = `${formattedStart} → ${formattedEnd}`
      }
      result.description = String(content.description || "")
    } else if (sectionName === "Project") {
      result.title = String(content.title || item.title || "")
      result.subtitle = String(content.org || content.company || "")
      const startDate = content.start || content.start_date
      const endDate = content.end || content.end_date
      if (startDate) {
        const formattedStart = formatDate(String(startDate))
        const formattedEnd = endDate ? formatDate(String(endDate)) : "Present"
        result.dateString = `${formattedStart} → ${formattedEnd}`
      }
      result.description = String(content.description || "")
      result.bullets = Array.isArray(content.bullets) ? content.bullets as string[] : []
      if (result.bullets.length === 0 && result.description) {
        result.bullets = [result.description]
      }
      result.skills = Array.isArray(content.skills) ? content.skills as string[] : []
      result.technologies = result.skills
    } else if (sectionName === "Skill") {
      result.title = String(content.category || content.title || item.title || "Skill")
      if (Array.isArray(content.skills)) {
        result.skills = content.skills as string[]
      } else if (typeof content.skills === "string") {
        result.skills = content.skills.split(",").map((s: string) => s.trim())
      } else if (Array.isArray(content.items)) {
        result.skills = content.items as string[]
      }
      result.subtitle = result.skills.join(", ")
    } else if (sectionName === "Link") {
      result.title = String(content.label || content.title || "")
      result.subtitle = String(content.url || "")
    } else {
      result.title = String(content.title || item.title || "Untitled")
      result.subtitle = String(content.subtitle || "")
      result.description = String(content.description || "")
    }

    return result
  }

  const extracted = extractItemContent(section.typeName, content, item)

  return (
    <div
      data-item-draggable="true"
      onDragOver={handleItemDragOver}
      onDragLeave={handleItemDragLeave}
      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); setDropPosition(null) }}
      className="relative"
    >
      {/* Drop indicator — above */}
      {dropPosition === "above" && (
        <div className="absolute left-0 right-0 z-10 pointer-events-none flex items-center gap-1" style={{ top: "-5px" }}>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "var(--accent)" }} />
          <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </div>
      )}

      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation()
          // Tag this drag as an item drag so section dragover can ignore it
          e.dataTransfer.setData("application/drag-type-item", "true")
          e.dataTransfer.effectAllowed = "move"
          setDraggedItem({ sectionIndex, itemIndex })
          lastMoveRef.current = null
        }}
        onDragEnd={handleLocalDragEnd}
        className={`group flex items-start gap-3 p-4 rounded-lg border transition-all duration-150 ${
          isItemDragging ? "opacity-40 scale-[0.98]" : "opacity-100"
        }`}
        style={{
          borderColor: isItemDragging ? "var(--accent)" : "var(--grid)",
          backgroundColor: "var(--paper)",
          cursor: "grab",
        }}
      >
        <div className="flex items-start gap-2 shrink-0">
          <input
            type="checkbox"
            checked={!!isSelected(item.id)}
            onChange={(e) => {
              e.stopPropagation()
              toggleItem(item.id, item.item_type_id)
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            draggable={false}
            className="w-5 h-5 rounded border-gray-300 text-[#8b4513] focus:ring-[#8b4513] cursor-pointer mt-1"
            aria-label="Select item for resume"
          />
          <div className="mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 shrink-0" style={{ color: "var(--ink-light)" }} />
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <div className="font-medium" style={{ color: "var(--ink)" }}>{extracted.title}</div>
            {extracted.subtitle && (
              <div className="text-sm" style={{ color: "var(--ink-fade)" }}>{extracted.subtitle}</div>
            )}
          </div>

          {(extracted.dateString || extracted.location) && (
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {extracted.dateString && (
                <span style={{ color: "var(--ink-light)" }}>{extracted.dateString}</span>
              )}
              {extracted.location && (
                <span style={{ color: "var(--ink-light)" }}>• {extracted.location}</span>
              )}
            </div>
          )}

          {extracted.bullets.length > 0 && (
            <ul className="text-sm space-y-1 pl-4" style={{ color: "var(--ink)" }}>
              {extracted.bullets.map((bullet: string, idx: number) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2" style={{ color: "var(--ink-light)" }}>•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}

          {extracted.description && extracted.bullets.length === 0 && (
            <div className="text-sm" style={{ color: "var(--ink)" }}>{extracted.description}</div>
          )}

          {(extracted.skills.length > 0 || extracted.technologies.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(extracted.technologies.length > 0 ? extracted.technologies : extracted.skills).map(
                (tech: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs font-medium rounded-full border"
                    style={{
                      backgroundColor: "var(--accent)",
                      color: "var(--paper)",
                      borderColor: "var(--accent-hover)",
                    }}
                  >
                    {tech}
                  </span>
                )
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          <label className="text-xs" style={{ color: "var(--ink-light)" }}>#</label>
          <input
            type="text"
            value={
              editingKey === `item-${sectionIndex}-${itemIndex}`
                ? editingPosition
                : itemIndex + 1
            }
            onFocus={() => handlePositionFocus(`item-${sectionIndex}-${itemIndex}`, itemIndex + 1)}
            onChange={(e) => setEditingPosition(e.target.value)}
            onBlur={(e) => {
              handlePositionBlur()
              const val = parseInt(e.target.value)
              if (!isNaN(val)) handleItemPositionChange(val)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const val = parseInt(editingPosition)
                if (!isNaN(val)) handleItemPositionChange(val)
                e.currentTarget.blur()
              }
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.preventDefault()}
            draggable={false}
            className="w-14 px-2 py-1 text-xs border rounded text-center focus:outline-none cursor-text"
            style={{
              borderColor: "var(--grid)",
              color: "var(--ink)",
              backgroundColor: "var(--paper)",
            }}
          />
        </div>
      </div>

      {/* Drop indicator — below */}
      {dropPosition === "below" && (
        <div className="absolute left-0 right-0 z-10 pointer-events-none flex items-center gap-1" style={{ bottom: "-5px" }}>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: "var(--accent)" }} />
          <div className="flex-1 h-0.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
        </div>
      )}
    </div>
  )
}