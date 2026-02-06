"use client"

import type { CanonItem, ItemType } from "@/lib/types"
import { WorkCard } from "./cards/WorkCard"
import { EducationCard } from "./cards/EducationCard"
import { ProjectCard } from "./cards/ProjectCard"
import { SkillCard } from "./cards/SkillCard"
import { LinkCard } from "./cards/LinkCard"
import { MiscCard } from "./cards/MiscCard"
import { useWorkingState } from "@/lib/working-state/useWorkingState"

type Props = {
  items: CanonItem<unknown>[]
  itemTypes: ItemType[]
  onEdit: (item: CanonItem<unknown>) => void
  onDelete: (id: string) => void | Promise<void>
}

export function CanonList({ items, itemTypes, onEdit, onDelete }: Props) {
  const { isSelected, toggleItem } = useWorkingState()

  const getTypeName = (typeId: string) => itemTypes.find((t) => t.id === typeId)?.display_name ?? "Unknown"

  const renderItem = (item: CanonItem<unknown>) => {
    const typeName = getTypeName(item.item_type_id)
    const handleEdit = () => onEdit(item)
    const handleDelete = () => onDelete(item.id)

    const selected = isSelected(item.id)

    const handleToggle = () => toggleItem(item.id, item.item_type_id)

    switch (typeName) {
      case "Work Experience":

        return <WorkCard item={item} onEdit={handleEdit} onDelete={handleDelete} selected={selected} onToggle={handleToggle} />
      case "Education":
        return <EducationCard item={item} onEdit={handleEdit} onDelete={handleDelete} selected={selected} onToggle={handleToggle} />
      case "Projects":
        return <ProjectCard item={item} onEdit={handleEdit} onDelete={handleDelete} selected={selected} onToggle={handleToggle} />
      case "Skills":
        return <SkillCard item={item} onEdit={handleEdit} onDelete={handleDelete} selected={selected} onToggle={handleToggle} />
      case "Links":
        return <LinkCard item={item} onEdit={handleEdit} onDelete={handleDelete} selected={selected} onToggle={handleToggle} />
      default:
        return <MiscCard item={item} typeName={typeName} onEdit={handleEdit} onDelete={handleDelete} selected={selected} onToggle={handleToggle} />
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-(--ink-fade) mb-4 text-lg">No items yet</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id}>{renderItem(item)}</div>
      ))}
    </div>
  )
}