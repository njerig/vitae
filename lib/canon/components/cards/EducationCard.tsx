import { GraduationCap } from "lucide-react"
import { Card } from "./Card"
import { formatDate, getBullets, renderBulletList, type CardProps } from "./shared"

export function EducationCard({ item, onEdit, onDelete }: CardProps) {

  // Compute content from item and display in the <Card /> component
  const c = (item.content ?? {}) as Record<string, unknown>
  const bullets = getBullets(c)

  const subtitle = (
    <>
      {String(c.degree || "")}
      {c.field ? ` in ${String(c.field)}` : ""}
      {c.gpa ? <span className="ml-2">GPA: {String(c.gpa)}</span> : null}
    </>
  )

  return (
    <Card
      icon={<GraduationCap className="w-5 h-5 text-(--accent)" />}
      title={String(c.institution || "Untitled")}
      subtitle={subtitle}
      meta={`${formatDate(c.start as string)} → ${c.end ? formatDate(c.end as string) : "Present"}`}
      body={renderBulletList(bullets)}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
