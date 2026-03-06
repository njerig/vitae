import type { CanonItem } from "@/lib/shared/types"
import { COLORS, FIELD_LABELS } from "./constants"

// Extend colors to include reordered state
const REORDERED_COLORS = {
  bg: "#fdfaf0",
  border: "#c9b580",
  text: "#7c5c12",
  badge: "#faefd0",
}

// Renders a single item card for one side of the diff
export function ItemCard({
  item,
  status,
  position,
  otherPosition,
}: {
  item: CanonItem
  status: "added" | "removed" | "reordered" | "unchanged"
  // For reordered items: this side's position and the other side's position
  position?: number
  otherPosition?: number
}) {
  const colors = status === "reordered" ? REORDERED_COLORS : COLORS[status as keyof typeof COLORS]
  const content = (item.content ?? {}) as Record<string, unknown>

  return (
    <div
      style={{
        border: `1px solid ${colors.border}`,
        borderRadius: "10px",
        padding: "12px 14px",
        marginBottom: "8px",
        background: colors.bg,
      }}
    >
      {/* Item title and status badge */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: "0.88rem",
            color: colors.text,
            fontFamily: "var(--font-sans)",
          }}
        >
          {item.title || "Untitled"}
        </span>
        {status !== "unchanged" && (
          <span
            style={{
              background: colors.badge,
              color: colors.text,
              border: `1px solid ${colors.border}`,
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "999px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              flexShrink: 0,
              marginLeft: "8px",
            }}
          >
            {status === "reordered" && position && otherPosition
              ? `#${position} → #${otherPosition}`
              : status === "reordered"
                ? "Moved"
                : status}
          </span>
        )}
      </div>

      {/* Render non-empty content fields */}
      {Object.entries(content).map(([key, val]) => {
        if (!val || (Array.isArray(val) && val.length === 0)) return null
        const label = FIELD_LABELS[key] ?? key
        const display = Array.isArray(val) ? (val as string[]).join(", ") : String(val)
        return (
          <div
            key={key}
            style={{ fontSize: "0.75rem", color: "var(--ink-light)", marginBottom: "3px" }}
          >
            <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{label}: </span>
            <span>{display}</span>
          </div>
        )
      })}
    </div>
  )
}

// Renders a placeholder card for a missing item on one side of the diff
export function EmptyItemCard({ label }: { label: string }) {
  return (
    <div
      style={{
        border: "1px dashed var(--grid)",
        borderRadius: "10px",
        padding: "12px 14px",
        marginBottom: "8px",
        background: "transparent",
        minHeight: "52px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span style={{ fontSize: "0.75rem", color: "var(--ink-fade)", fontStyle: "italic" }}>
        {label}
      </span>
    </div>
  )
}
