import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle: string
  leading?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, leading, actions, children }: PageHeaderProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
      <div className={`flex justify-between items-center`}>
        <div className="flex items-center gap-4">
          {leading != null && <div className="flex-shrink-0">{leading}</div>}
          <div>
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">{title}</h2>
            <p className="text-lg text-gray-600">{subtitle}</p>
          </div>
        </div>
        {actions != null && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {children}
    </div>
  )
}
