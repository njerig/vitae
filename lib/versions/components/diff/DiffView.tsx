"use client"

import { useRef, useCallback, useState } from "react"
import type { VersionGroup } from "@/lib/shared/types"
import { useDiff } from "./UseDiff"
import { VersionSelector } from "./VersionSelector"
import { SectionRow } from "./SectionRow"

export function DiffView({ groups }: { groups: VersionGroup[] }) {
  const {
    versionAId,
    versionBId,
    setVersionAId,
    setVersionBId,
    versionAName,
    versionBName,
    diff,
    isLoading,
    error,
    sameVersionSelected,
  } = useDiff(groups)

  // Filter bar state
  type FilterMode = "all" | "changed"
  const [filterMode, setFilterMode] = useState<FilterMode>("all")

  // Per-section collapsed state, keyed by item_type_id
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSection = useCallback((typeId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [typeId]: !prev[typeId] }))
  }, [])

  // Refs for scroll sync
  const leftColRef = useRef<HTMLDivElement>(null)
  const rightColRef = useRef<HTMLDivElement>(null)
  const isSyncingLeft = useRef(false)
  const isSyncingRight = useRef(false)

  const handleLeftScroll = useCallback(() => {
    if (isSyncingLeft.current) return
    isSyncingRight.current = true
    if (rightColRef.current && leftColRef.current) {
      rightColRef.current.scrollTop = leftColRef.current.scrollTop
    }
    requestAnimationFrame(() => {
      isSyncingRight.current = false
    })
  }, [])

  const handleRightScroll = useCallback(() => {
    if (isSyncingRight.current) return
    isSyncingLeft.current = true
    if (leftColRef.current && rightColRef.current) {
      leftColRef.current.scrollTop = rightColRef.current.scrollTop
    }
    requestAnimationFrame(() => {
      isSyncingLeft.current = false
    })
  }, [])

  const allItems = diff?.sections.flatMap((s) => s.items) ?? []
  const removedCount = allItems.filter((i) => i.type === "removed").length
  const addedCount = allItems.filter((i) => i.type === "added").length
  const reorderedCount =
    allItems.filter((i) => i.type === "reordered").length +
    (diff?.sections.filter(
      (s) => s.sectionStatus === "reordered" && s.items.every((i) => i.type === "unchanged")
    ).length ?? 0)

  const visibleSections =
    diff?.sections.filter((s) => filterMode === "all" || s.sectionStatus !== "unchanged") ?? []

  // Determine collapsed state for a section (default: unchanged=collapsed, else expanded)
  const isCollapsed = (typeId: string, sectionStatus: string) => {
    if (typeId in collapsedSections) return collapsedSections[typeId]
    return sectionStatus === "unchanged"
  }

  return (
    <div>
      {/* Page title and description */}
      <div
        style={{
          marginBottom: "20px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--grid)",
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-serif, serif)",
            fontSize: "1.5rem",
            color: "var(--ink)",
            marginBottom: "4px",
            fontWeight: 600,
          }}
        >
          Compare Resume Versions
        </h2>
        <p
          style={{ fontSize: "0.85rem", color: "var(--ink-fade)", fontFamily: "var(--font-sans)" }}
        >
          Select two versions to see what changed between them.
        </p>
      </div>

      {/* Version selectors */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "flex-end",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <VersionSelector
          groups={groups}
          label="Version A"
          selectedId={versionAId}
          onChange={setVersionAId}
          disabledId={versionBId}
        />
        <div
          style={{
            fontSize: "1.1rem",
            color: "var(--ink-fade)",
            paddingBottom: "10px",
            flexShrink: 0,
          }}
        >
          vs
        </div>
        <VersionSelector
          groups={groups}
          label="Version B"
          selectedId={versionBId}
          onChange={setVersionBId}
          disabledId={versionAId}
        />
      </div>

      {sameVersionSelected && (
        <p
          style={{
            color: "#7c5c12",
            fontSize: "0.85rem",
            marginBottom: "16px",
            fontFamily: "var(--font-sans)",
          }}
        >
          Please select two different versions to compare.
        </p>
      )}
      {error && (
        <p style={{ color: "#7c1212", fontSize: "0.85rem", marginBottom: "16px" }}>
          Error: {error}
        </p>
      )}
      {isLoading && (
        <p
          style={{ color: "var(--ink-fade)", fontSize: "0.85rem", fontFamily: "var(--font-sans)" }}
        >
          Loading…
        </p>
      )}

      {!isLoading && !sameVersionSelected && !diff && (
        <div
          style={{
            border: "1px dashed var(--grid)",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
            color: "var(--ink-fade)",
            fontSize: "0.9rem",
            fontFamily: "var(--font-sans)",
            background: "var(--surface, #faf9f7)",
          }}
        >
          Select two versions above to compare them.
        </div>
      )}

      {diff && !diff.hasChanges && (
        <div
          style={{
            border: "1px solid #d4a574",
            borderRadius: "12px",
            padding: "24px",
            textAlign: "center",
            background: "#fdf6f0",
            color: "#7c3d12",
            fontSize: "0.9rem",
            fontFamily: "var(--font-sans)",
          }}
        >
          ✓ No differences found between these two versions.
        </div>
      )}

      {diff && diff.hasChanges && (
        <div>
          {/* Filter toggle */}
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "12px" }}>
            <div
              style={{
                display: "flex",
                gap: "4px",
                background: "var(--surface, #faf9f7)",
                border: "1px solid var(--grid)",
                borderRadius: "8px",
                padding: "3px",
              }}
            >
              {(["all", "changed"] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  style={{
                    padding: "4px 12px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: filterMode === mode ? "var(--ink)" : "transparent",
                    color: filterMode === mode ? "white" : "var(--ink-fade)",
                    transition: "all 0.15s",
                  }}
                >
                  {mode === "all" ? "All Sections" : "Changes Only"}
                </button>
              ))}
            </div>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                padding: "10px 14px",
                background: "#fdf0f0",
                border: "1px solid #c9a0a0",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "#7c1212",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {versionAName || "Version A"}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                {removedCount > 0 && (
                  <span style={{ fontSize: "0.72rem", color: "#7c1212", opacity: 0.8 }}>
                    {removedCount} removed
                  </span>
                )}
                {reorderedCount > 0 && removedCount === 0 && (
                  <span style={{ fontSize: "0.72rem", color: "#7c5c12", opacity: 0.8 }}>
                    {reorderedCount} moved
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                padding: "10px 14px",
                background: "#fdf6f0",
                border: "1px solid #d4a574",
                borderRadius: "10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  color: "#7c3d12",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {versionBName || "Version B"}
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                {addedCount > 0 && (
                  <span style={{ fontSize: "0.72rem", color: "#7c3d12", opacity: 0.8 }}>
                    {addedCount} added
                  </span>
                )}
                {reorderedCount > 0 && addedCount === 0 && (
                  <span style={{ fontSize: "0.72rem", color: "#7c5c12", opacity: 0.8 }}>
                    {reorderedCount} moved
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Scroll-synced columns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            <div
              ref={leftColRef}
              onScroll={handleLeftScroll}
              style={{ overflowY: "auto", maxHeight: "65vh", paddingRight: "4px" }}
            >
              {visibleSections.map((section) => (
                <SectionRow
                  key={section.item_type_id}
                  section={section}
                  side="left"
                  collapsed={isCollapsed(section.item_type_id, section.sectionStatus)}
                  onToggle={() => toggleSection(section.item_type_id)}
                />
              ))}
            </div>
            <div
              ref={rightColRef}
              onScroll={handleRightScroll}
              style={{ overflowY: "auto", maxHeight: "65vh", paddingLeft: "4px" }}
            >
              {visibleSections.map((section) => (
                <SectionRow
                  key={section.item_type_id}
                  section={section}
                  side="right"
                  collapsed={isCollapsed(section.item_type_id, section.sectionStatus)}
                  onToggle={() => toggleSection(section.item_type_id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
