import { Tags } from "lucide-react"
import { Card } from "./Card"
import type { CardProps } from "./shared"

export function SkillCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const skills = (c.skills as string[]) ?? []

  const body = skills.length > 0 ? (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {skills.map((s, i) => (
        <span key={i} className="card-token">
          {s}
        </span>
      ))}
    </div>
  ) : undefined

  return (
    <Card
      icon={<Tags className="w-5 h-5 text-(--accent)" />}
      title={String(c.category || "General")}
      body={body}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
