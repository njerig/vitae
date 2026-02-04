import type { ReactNode } from "react"
import { CardActions } from "./shared"

type CardProps = {
  icon: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  meta?: string
  body?: ReactNode
  onEdit: () => void
  onDelete: () => void
}

export function Card({ icon, title, subtitle, meta, body, onEdit, onDelete }: CardProps) {
  return (
    <div className="card">
      <div className="flex gap-4">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0">
              <h4 className="card-title">{title}</h4>
              {subtitle && <p className="card-text">{subtitle}</p>}
              {meta && <p className="card-text text-xs mt-0.5">{meta}</p>}
            </div>
            <CardActions onEdit={onEdit} onDelete={onDelete} />
          </div>
          {body}
        </div>
      </div>
    </div>
  )
}
