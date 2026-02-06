import { Globe } from "lucide-react"
import { Card } from "./Card"
import { getBullets, renderBulletList, type CardProps } from "./shared"

export function LinkCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>
  const bullets = getBullets(c)
  const url = typeof c.url === "string" ? c.url : ""
  const displayUrl = url.replace(/^https?:\/\//, "").slice(0, 40)

  const subtitle = url ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className="card-link text-sm truncate block hover:underline">
      {displayUrl}
      {displayUrl.length >= 40 ? "..." : ""}
    </a>
  ) : undefined

  return (
    <Card
      icon={<Globe className="w-5 h-5 text-(--accent)" />}
      title={String(c.label || "Link")}
      subtitle={subtitle}
      body={renderBulletList(bullets)}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
