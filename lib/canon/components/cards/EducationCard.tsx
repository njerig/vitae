import { GraduationCap } from "lucide-react"
import { Card } from "./Card"
import { formatDate, type CardProps } from "./shared"

export function EducationCard({ item, onEdit, onDelete }: CardProps) {
  const c = (item.content ?? {}) as Record<string, unknown>

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
      onEdit={onEdit}
      onDelete={onDelete}
    />
  )
}
