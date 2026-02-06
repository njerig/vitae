import { FileText } from "lucide-react"
import { Card } from "./Card"
import { formatDate, getBullets, renderBulletList, type CardProps } from "./shared"

type MiscCardProps = CardProps & {
  typeName: string
}

export function MiscCard({ item, typeName, onEdit, onDelete }: MiscCardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const bullets = getBullets(c)

  const title = (
    <div className="flex items-center gap-2">
      <span className="truncate">{String(c.title || item.title || "Untitled")}</span>
      <span className="card-token shrink-0">{typeName}</span>
    </div>
  )

  const meta = (typeof c.start === "string" || typeof c.end === "string")
    ? `${formatDate(c.start as string)} → ${c.end ? formatDate(c.end as string) : "Present"}`
    : undefined

  const body = renderBulletList(bullets)

  return (
    <Card
      icon={<FileText className="w-5 h-5 text-(--accent)" />}
      title={title}
      meta={meta}
      body={body}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
