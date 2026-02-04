import { GraduationCap } from "lucide-react"
import { CardActions, formatDate, type CardProps } from "./shared"

export function EducationCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
          <GraduationCap className="w-5 h-5 text-(--accent)" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h4 className="text-gray-900 font-semibold truncate">{String(c.institution || "Untitled")}</h4>
              <p className="text-gray-600 text-sm">
                {String(c.degree || "")}
                {c.field ? ` in ${String(c.field)}` : ""}
                {c.gpa ? <span className="text-gray-400 ml-2">GPA: {String(c.gpa)}</span> : null}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">
                {formatDate(c.start as string)} → {c.end ? formatDate(c.end as string) : "Present"}
              </p>
            </div>
            <CardActions onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </div>
  )
}
