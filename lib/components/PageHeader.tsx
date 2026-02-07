interface PageHeaderProps {
  title: string
  subtitle: string
  actions?: React.ReactNode
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions, children }: PageHeaderProps) {
  return (
    <div>
      <div className={`flex justify-between items-center ${children != null ? "mb-6" : ""}`}>
        <div>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">{title}</h2>
          <p className="text-lg text-gray-600">{subtitle}</p>
        </div>
        {actions != null && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
