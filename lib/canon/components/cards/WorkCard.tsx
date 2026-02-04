import { Briefcase } from "lucide-react"
import { CardActions, formatDate, type CardProps } from "./shared"

export function WorkCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const bullets = (c.bullets as string[]) ?? []
  const skills = (c.skills as string[]) ?? []

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
          <Briefcase className="w-5 h-5 text-(--accent)" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h4 className="text-gray-900 font-semibold text-lg truncate">{String(c.role || "Untitled")}</h4>
              <p className="text-blue-600 font-medium text-sm">{String(c.org || "")}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {formatDate(c.start as string)} → {c.end ? formatDate(c.end as string) : "Present"}
              </p>
            </div>
            <CardActions onEdit={onEdit} onDelete={onDelete} />
          </div>
          {bullets.length > 0 && (
            <ul className="text-gray-600 text-sm mt-2 list-disc pl-4 space-y-0.5">
              {bullets.map((b, i) => (
                <li key={i} className="truncate">
                  {b}
                </li>
              ))}
            </ul>
          )}
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {skills.map((s, i) => (
                <span key={i} className="px-2 py-0.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
