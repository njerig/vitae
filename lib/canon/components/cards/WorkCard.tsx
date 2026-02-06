import { Briefcase } from "lucide-react"
import { Card } from "./Card"
import { formatDate, getBullets, renderBulletList, type CardProps } from "./shared"

export function WorkCard({ item, onEdit, onDelete, selected, onToggle }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const bullets = getBullets(c)
  const skills = (c.skills as string[]) ?? []

  const body = (
    <>
      {renderBulletList(bullets)}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {skills.map((s, i) => (
            <span key={i} className="card-token">
              {s}
            </span>
          ))}
        </div>
      )}
    </>
  )

  return (
    <Card
      icon={<Briefcase className="w-5 h-5 text-(--accent)" />}
      title={String(c.role || "Untitled")}
      subtitle={String(c.org || "")}
      meta={`${formatDate(c.start as string)} → ${c.end ? formatDate(c.end as string) : "Present"}`}
      body={body}
      onEdit={onEdit}
      onDelete={onDelete}
      selected={selected}
      onToggle={onToggle}
    />
  )
}
