import { CardActions, formatDate, type CardProps } from "./shared"

type GenericCardProps = CardProps & {
  typeName: string
}

export function GenericCard({ item, typeName, onEdit, onDelete }: GenericCardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const bullets = (c.bullets as string[]) ?? []

  return (
    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-gray-900 font-semibold truncate">{String(c.title || item.title || "Untitled")}</h4>
            <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full shrink-0">{typeName}</span>
          </div>
          {(typeof c.start === "string" || typeof c.end === "string") && (
            <p className="text-gray-500 text-xs">
              {formatDate(c.start as string)} → {c.end ? formatDate(c.end as string) : "Present"}
            </p>
          )}
          {bullets.length > 0 && (
            <ul className="text-gray-600 text-sm mt-2 list-disc pl-4">
              {bullets.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          )}
        </div>
        <CardActions onEdit={onEdit} onDelete={onDelete} />
      </div>
    </div>
  )
}
