import { useState } from "react"
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
  handleItemDragEnd
}: any) {
  const [editingPosition, setEditingPosition] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const content = (item.content ?? {}) as Record<string, unknown>
  const isItemDragging = draggedItem?.sectionIndex === sectionIndex && draggedItem?.itemIndex === itemIndex

  const validatePosition = (position: number, max: number) => 
    position >= 1 && position <= max && !isNaN(position)

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newSections = [...sections]
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

  const handleItemDragStart = () => {
    setDraggedItem({ sectionIndex, itemIndex })
  }

  const handleItemDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!draggedItem || draggedItem.sectionIndex !== sectionIndex || draggedItem.itemIndex === itemIndex) return
    const newSections = moveItem(draggedItem.itemIndex, itemIndex)
    setSections(newSections)
    setDraggedItem({ sectionIndex, itemIndex })
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
      } else if (typeof content.skills === 'string') {
        result.skills = content.skills.split(',').map(s => s.trim())
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
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        handleItemDragStart()
      }}
      onDragOver={handleItemDragOver}
      onDragEnd={handleItemDragEnd}
      className={`group flex items-start gap-3 p-4 rounded-lg border cursor-move transition-all ${
        isItemDragging ? "opacity-50" : ""
      }`}
      style={{ 
        borderColor: "var(--grid)",
        backgroundColor: "var(--paper)"
      }}
    >
      <GripVertical className="w-4 h-4 shrink-0 mt-1 transition-colors" style={{ color: "var(--ink-light)" }} />
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
            {(extracted.technologies.length > 0 ? extracted.technologies : extracted.skills).map((tech: string, idx: number) => (
              <span 
                key={idx} 
                className="px-2.5 py-1 text-xs font-medium rounded-full border"
                style={{ 
                  backgroundColor: "var(--accent)",
                  color: "var(--paper)",
                  borderColor: "var(--accent-hover)"
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
        <label className="text-xs" style={{ color: "var(--ink-light)" }}>#</label>
        <input
          type="text"
          value={editingKey === `item-${sectionIndex}-${itemIndex}` ? editingPosition : itemIndex + 1}
          onFocus={() => handlePositionFocus(`item-${sectionIndex}-${itemIndex}`, itemIndex + 1)}
          onChange={(e) => setEditingPosition(e.target.value)}
          onBlur={(e) => {
            handlePositionBlur()
            const val = parseInt(e.target.value)
            if (!isNaN(val)) handleItemPositionChange(val)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
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
            backgroundColor: "var(--paper)"
          }}
        />
      </div>
    </div>
  )
}