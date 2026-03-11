"use client"

type SegmentedSwitchOption<T extends string> = {
  value: T
  label: string
}

type SegmentedSwitchProps<T extends string> = {
  value: T
  options: SegmentedSwitchOption<T>[]
  onChange: (value: T) => void
  variant?: "primary" | "secondary"
  size?: "sm" | "md"
  ariaLabel?: string
}

/**
 * Generic segmented control with theme-aware variants.
 *
 * @param props - Segmented control properties.
 * @param props.value - Currently selected option value.
 * @param props.options - Ordered list of selectable options.
 * @param props.onChange - Called with selected option value.
 * @param props.variant - Visual style variant.
 * @param props.size - Height and text-size preset.
 * @param props.ariaLabel - Accessibility label for the tablist.
 * @returns Segmented switch JSX.
 */
export function SegmentedSwitch<T extends string>({
  value,
  options,
  onChange,
  variant = "primary",
  size = "md",
  ariaLabel,
}: SegmentedSwitchProps<T>) {
  const activeBg = variant === "primary" ? "var(--accent)" : "var(--ink)"
  const activeText = "var(--paper)"
  const inactiveBg = "transparent"
  const inactiveText = "var(--ink)"
  const heightClass = size === "sm" ? "h-8" : "h-9"
  const textClass = size === "sm" ? "text-xs" : "text-sm"

  return (
    <div
      className="inline-flex items-stretch rounded-lg border overflow-hidden"
      style={{ borderColor: "var(--grid)" }}
      role="tablist"
      aria-label={ariaLabel}
    >
      {options.map((option, index) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`px-3 ${heightClass} ${textClass} font-medium whitespace-nowrap`}
            style={{
              backgroundColor: selected ? activeBg : inactiveBg,
              color: selected ? activeText : inactiveText,
              borderLeft:
                index > 0 && !selected
                  ? "1px solid var(--grid)"
                  : index > 0
                    ? "1px solid transparent"
                    : "none",
            }}
            role="tab"
            aria-selected={selected}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
