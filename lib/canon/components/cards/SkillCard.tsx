import { CardActions, type CardProps } from "./shared"

// Tags/puzzle icon
function SkillIcon() {
  return (
    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    </div>
  )
}

export function SkillCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const skills = (c.skills as string[]) ?? []

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        <SkillIcon />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <span className="text-gray-900 font-medium">{String(c.category || "General")}</span>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((s, i) => <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded-full">{s}</span>)}
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
