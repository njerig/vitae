import { Globe } from "lucide-react"
import { CardActions, type CardProps } from "./shared"

export function LinkCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const url = typeof c.url === "string" ? c.url : ""
  const displayUrl = url.replace(/^https?:\/\//, "").slice(0, 40)

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
          <Globe className="w-5 h-5 text-(--accent)" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h4 className="text-gray-900 font-medium">{String(c.label || "Link")}</h4>
              {url && (
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm truncate block">
                  {displayUrl}
                  {displayUrl.length >= 40 ? "..." : ""}
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
