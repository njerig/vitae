"use client"

import { useState } from "react"
import type { SectionDiff } from "../../diffResumes"
import { ItemCard, EmptyItemCard } from "./ItemCard"

// Renders a collapsible side-by-side row for a single section across both versions
export function SectionRow({ section }: { section: SectionDiff }) {
  // Unchanged sections collapse by default to reduce visual noise
  const [collapsed, setCollapsed] = useState(section.sectionStatus === "unchanged")
  const changedCount = section.items.filter((i) => i.type !== "unchanged").length

  // Removed items show only on the left (A), added only on the right (B), unchanged on both
  const leftItems = section.items.filter((i) => i.type === "removed" || i.type === "unchanged")
  const rightItems = section.items.filter((i) => i.type === "added" || i.type === "unchanged")

  // Pair up left and right items row by row, filling gaps with null for placeholders
  const maxRows = Math.max(leftItems.length, rightItems.length)
  const pairs = Array.from({ length: maxRows }, (_, i) => ({
    left: leftItems[i] ?? null,
    right: rightItems[i] ?? null,
  }))

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Section header with status badges and collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
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
        }}
      >
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
        <span style={{ marginLeft: "auto", color: "var(--ink-fade)", fontSize: "0.75rem" }}>
          {collapsed ? "▼" : "▲"}
        </span>
      </button>

      {/* Side-by-side item pairs, hidden when collapsed */}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {pairs.map((pair, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {/* Left side (Version A) */}
              {pair.left ? (
                <ItemCard
                  item={pair.left.item}
                  status={pair.left.type === "unchanged" ? "unchanged" : "removed"}
                />
              ) : (
                <EmptyItemCard label="Not in this version" />
              )}
              {/* Right side (Version B) */}
              {pair.right ? (
                <ItemCard
                  item={pair.right.item}
                  status={pair.right.type === "unchanged" ? "unchanged" : "added"}
                />
              ) : (
                <EmptyItemCard label="Not in this version" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
