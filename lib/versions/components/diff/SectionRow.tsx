"use client"

import type { SectionDiff } from "../../diffResumes"
import { ItemCard, EmptyItemCard } from "./ItemCard"

type SectionRowProps = {
  section: SectionDiff
  side: "left" | "right"
  // Collapsed state and toggle are controlled by parent so both sides stay in sync
  collapsed: boolean
  onToggle: () => void
}

// Renders one side of a section row. Both sides share collapsed state from DiffView.
export function SectionRow({ section, side, collapsed, onToggle }: SectionRowProps) {
  const changedCount = section.items.filter((i) => i.type !== "unchanged").length

  // Left side shows removed + unchanged + reordered; right shows added + unchanged + reordered
  const items =
    side === "left"
      ? section.items.filter(
          (i) => i.type === "removed" || i.type === "unchanged" || i.type === "reordered"
        )
      : section.items.filter(
          (i) => i.type === "added" || i.type === "unchanged" || i.type === "reordered"
        )

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Section header — both sides get a clickable toggle, left shows labels */}
      <button
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "100%",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "8px 0",
          marginBottom: "8px",
          borderBottom: "1px solid var(--grid)",
          textAlign: "left",
        }}
      >
        {/* Section name and badges only on left to avoid repetition */}
        {side === "left" ? (
          <>
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.8rem",
                color: "var(--ink)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontFamily: "var(--font-sans)",
              }}
            >
              {section.display_name}
            </span>
            {section.sectionStatus === "added" && (
              <span
                style={{
                  fontSize: "0.68rem",
                  background: "#fde8d0",
                  color: "#7c3d12",
                  border: "1px solid #d4a574",
                  borderRadius: "999px",
                  padding: "1px 8px",
                  fontWeight: 700,
                }}
              >
                New Section
              </span>
            )}
            {section.sectionStatus === "removed" && (
              <span
                style={{
                  fontSize: "0.68rem",
                  background: "#fad8d8",
                  color: "#7c1212",
                  border: "1px solid #c9a0a0",
                  borderRadius: "999px",
                  padding: "1px 8px",
                  fontWeight: 700,
                }}
              >
                Removed Section
              </span>
            )}
            {section.sectionStatus === "reordered" && (
              <span
                style={{
                  fontSize: "0.68rem",
                  background: "#faefd0",
                  color: "#7c5c12",
                  border: "1px solid #c9b580",
                  borderRadius: "999px",
                  padding: "1px 8px",
                  fontWeight: 700,
                }}
              >
                {section.sectionPositionA && section.sectionPositionB
                  ? `Moved #${section.sectionPositionA} → #${section.sectionPositionB}`
                  : "Reordered"}
              </span>
            )}
            {changedCount > 0 && section.sectionStatus === "changed" && (
              <span
                style={{
                  fontSize: "0.68rem",
                  background: "#faefd0",
                  color: "#7c5c12",
                  border: "1px solid #c9b580",
                  borderRadius: "999px",
                  padding: "1px 8px",
                  fontWeight: 700,
                }}
              >
                {changedCount} change{changedCount !== 1 ? "s" : ""}
              </span>
            )}
          </>
        ) : (
          /* Right side: just the section name, no badges */
          <span
            style={{
              fontWeight: 700,
              fontSize: "0.8rem",
              color: "var(--ink)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: "var(--font-sans)",
            }}
          >
            {section.display_name}
          </span>
        )}
        <span style={{ marginLeft: "auto", color: "var(--ink-fade)", fontSize: "0.75rem" }}>
          {collapsed ? "▼" : "▲"}
        </span>
      </button>

      {/* Item cards, hidden when collapsed */}
      {!collapsed && (
        <div>
          {items.length === 0 ? (
            <EmptyItemCard label="No items on this side" />
          ) : (
            items.map((itemDiff, i) => (
              <ItemCard
                key={i}
                item={itemDiff.item}
                status={
                  itemDiff.type === "unchanged"
                    ? "unchanged"
                    : itemDiff.type === "reordered"
                      ? "reordered"
                      : side === "left"
                        ? "removed"
                        : "added"
                }
                position={
                  itemDiff.type === "reordered"
                    ? side === "left"
                      ? itemDiff.positionA
                      : itemDiff.positionB
                    : undefined
                }
                otherPosition={
                  itemDiff.type === "reordered"
                    ? side === "left"
                      ? itemDiff.positionB
                      : itemDiff.positionA
                    : undefined
                }
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
