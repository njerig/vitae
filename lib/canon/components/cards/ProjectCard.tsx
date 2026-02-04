import { FolderKanban } from "lucide-react"
import { CardActions, type CardProps } from "./shared"

export function ProjectCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const skills = (c.skills as string[]) ?? []

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
          <FolderKanban className="w-5 h-5 text-(--accent)" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-gray-900 font-semibold truncate">{String(c.title || item.title || "Untitled")}</h4>
                {typeof c.url === "string" && c.url && (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 shrink-0">
                    ↗
                  </a>
                )}
              </div>
              {typeof c.description === "string" && c.description && <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">{c.description}</p>}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.slice(0, 4).map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-full">
                      {s}
                    </span>
                  ))}
                  {skills.length > 4 && <span className="text-gray-400 text-xs">+{skills.length - 4}</span>}
                </div>
              )}
            </div>
            <CardActions onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </div>
  )
}
