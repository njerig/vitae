import { CardActions, type CardProps } from "./shared"

// Globe/link icon
function LinkIcon() {
  return (
    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center shrink-0">
      <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    </div>
  )
}

export function LinkCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const url = typeof c.url === "string" ? c.url : ""
  const displayUrl = url.replace(/^https?:\/\//, "").slice(0, 40)

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        <LinkIcon />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h4 className="text-gray-900 font-medium">{String(c.label || "Link")}</h4>
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm truncate block">
                  {displayUrl}{displayUrl.length >= 40 ? "..." : ""}
                </a>
              )}
            </div>
            <CardActions onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>
      </div>
    </div>
  )
}
