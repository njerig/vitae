import { Tags } from "lucide-react"
import { CardActions, type CardProps } from "./shared"

export function SkillCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const skills = (c.skills as string[]) ?? []

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
          <Tags className="w-5 h-5 text-(--accent)" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-gray-900 font-medium">{String(c.category || "General")}</span>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((s, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded-full">
                      {s}
                    </span>
                  ))}
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
