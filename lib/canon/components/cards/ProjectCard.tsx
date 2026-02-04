import { FolderKanban } from "lucide-react"
import { Card } from "./Card"
import type { CardProps } from "./shared"

export function ProjectCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const skills = (c.skills as string[]) ?? []

  const title = (
    <div className="flex items-center gap-2">
      <span className="truncate">{String(c.title || item.title || "Untitled")}</span>
      {typeof c.url === "string" && c.url && (
        <a href={c.url} target="_blank" rel="noopener noreferrer" className="card-link shrink-0">
          ↗
        </a>
      )}
    </div>
  )

  const body = (
    <>
      {typeof c.description === "string" && c.description && <p className="card-text mt-0.5 line-clamp-2">{c.description}</p>}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {skills.slice(0, 4).map((s, i) => (
            <span key={i} className="card-token">
              {s}
            </span>
          ))}
          {skills.length > 4 && <span className="card-text text-xs">+{skills.length - 4}</span>}
        </div>
      )}
    </>
  )

  return (
    <Card
      icon={<FolderKanban className="w-5 h-5 text-(--accent)" />}
      title={title}
      body={body}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
