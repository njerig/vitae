import { CardActions, type CardProps } from "./shared"

// Folder/code icon
function ProjectIcon() {
  return (
    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    </div>
  )
}

export function ProjectCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const skills = (c.skills as string[]) ?? []

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        <ProjectIcon />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-gray-900 font-semibold truncate">{String(c.title || item.title || "Untitled")}</h4>
                {typeof c.url === "string" && c.url && (
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
              {typeof c.description === "string" && c.description && (
                <p className="text-gray-600 text-sm mt-0.5 line-clamp-2">{c.description}</p>
              )}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.slice(0, 4).map((s, i) => <span key={i} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">{s}</span>)}
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
