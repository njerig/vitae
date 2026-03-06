"use client"

import { useMemo, useState, useEffect } from "react"
import { diffResumes, ResumeSnapshot, SectionDiff } from "./diffResumes"
import { fetchVersionSnapshot } from "./api"
import type { CanonItem, ItemType, VersionGroup } from "@/lib/shared/types"

// Fetches all canon items for the current user
async function fetchAllItems(): Promise<CanonItem[]> {
  const res = await fetch("/api/canon", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch canon items")
  return res.json()
}

// Fetches all item types to resolve display names for sections
async function fetchItemTypes(): Promise<ItemType[]> {
  const res = await fetch("/api/item-types", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch item types")
  return res.json()
}

// Warm terracotta color palette
const COLORS = {
  added: { bg: "#fdf6f0", border: "#d4a574", text: "#7c3d12", badge: "#fde8d0" },
  removed: { bg: "#fdf0f0", border: "#c9a0a0", text: "#7c1212", badge: "#fad8d8" },
  unchanged: {
    bg: "var(--surface, #faf9f7)",
    border: "var(--grid)",
    text: "var(--ink)",
    badge: "#f0ede8",
  },
}

// Human-readable labels for item content fields
const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  org: "Organization",
  role: "Role",
  start: "Start Date",
  end: "End Date",
  bullets: "Bullets",
  skills: "Skills",
  institution: "Institution",
  degree: "Degree",
  field: "Field of Study",
  gpa: "GPA",
  description: "Description",
  url: "URL",
  label: "Label",
  category: "Category",
}

// Renders a single item card for one side of the diff
function ItemCard({
  item,
  status,
}: {
  item: CanonItem
  status: "added" | "removed" | "unchanged"
}) {
  const colors = COLORS[status]
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
            {status}
          </span>
        )}
      </div>

      {/* Render content fields */}
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

// Renders a placeholder card for a missing item on one side
function EmptyItemCard({ label }: { label: string }) {
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

// Renders a side-by-side row for a single section across both versions
function SectionRow({ section }: { section: SectionDiff }) {
  const [collapsed, setCollapsed] = useState(section.sectionStatus === "unchanged")
  const changedCount = section.items.filter((i) => i.type !== "unchanged").length

  // Separate items into those present in A and those present in B
  // Added items only appear on the right (B), removed only on the left (A)
  const leftItems = section.items.filter((i) => i.type === "removed" || i.type === "unchanged")
  const rightItems = section.items.filter((i) => i.type === "added" || i.type === "unchanged")

  // Pair up items for side-by-side rendering, filling gaps with placeholders
  const maxRows = Math.max(leftItems.length, rightItems.length)
  const pairs = Array.from({ length: maxRows }, (_, i) => ({
    left: leftItems[i] ?? null,
    right: rightItems[i] ?? null,
  }))

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Section header with collapse toggle */}
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

      {/* Side-by-side item pairs */}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
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

// Dropdown to select a version from grouped resume history
function VersionSelector({
  groups,
  label,
  selectedId,
  onChange,
  disabledId,
}: {
  groups: VersionGroup[]
  label: string
  selectedId: string
  onChange: (id: string) => void
  disabledId?: string
}) {
  return (
    <div style={{ flex: 1 }}>
      <label
        style={{
          display: "block",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "var(--ink-light)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: "6px",
          fontFamily: "var(--font-sans)",
        }}
      >
        {label}
      </label>
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          padding: "9px 12px",
          borderRadius: "var(--radius-soft, 8px)",
          border: "1px solid var(--grid)",
          fontFamily: "var(--font-sans)",
          fontSize: "0.85rem",
          color: "var(--ink)",
          background: "white",
          cursor: "pointer",
        }}
      >
        <option value="">Select a version…</option>
        {/* Group versions by resume name */}
        {groups.map((group) => (
          <optgroup key={group.resume_group_id} label={group.group_name}>
            {group.versions.map((v) => (
              <option key={v.id} value={v.id} disabled={v.id === disabledId}>
                {v.name || "Untitled"} — {new Date(v.created_at).toLocaleDateString()}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

export function DiffView({ groups }: { groups: VersionGroup[] }) {
  const [versionAId, setVersionAId] = useState("")
  const [versionBId, setVersionBId] = useState("")
  const [snapshotA, setSnapshotA] = useState<ResumeSnapshot | null>(null)
  const [snapshotB, setSnapshotB] = useState<ResumeSnapshot | null>(null)
  const [allItems, setAllItems] = useState<CanonItem[]>([])
  const [itemTypeMap, setItemTypeMap] = useState<Record<string, string>>({})
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch canon items and item types once on mount so we can resolve IDs to content
  useEffect(() => {
    Promise.all([fetchAllItems(), fetchItemTypes()])
      .then(([items, types]) => {
        setAllItems(items)
        // Build a lookup map from item_type_id -> display_name
        const typeMap: Record<string, string> = {}
        for (const t of types) typeMap[t.id] = t.display_name
        setItemTypeMap(typeMap)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingMeta(false))
  }, [])

  // Fetch snapshot for version A whenever selection changes
  useEffect(() => {
    if (!versionAId) {
      setSnapshotA(null)
      return
    }
    setLoadingA(true)
    fetchVersionSnapshot(versionAId)
      .then(setSnapshotA)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingA(false))
  }, [versionAId])

  // Fetch snapshot for version B whenever selection changes
  useEffect(() => {
    if (!versionBId) {
      setSnapshotB(null)
      return
    }
    setLoadingB(true)
    fetchVersionSnapshot(versionBId)
      .then(setSnapshotB)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingB(false))
  }, [versionBId])

  // Recompute diff only when snapshots or supporting data change
  const diff = useMemo(() => {
    if (!snapshotA || !snapshotB) return null
    return diffResumes(snapshotA, snapshotB, allItems, itemTypeMap)
  }, [snapshotA, snapshotB, allItems, itemTypeMap])

  const versionAName = groups.flatMap((g) => g.versions).find((v) => v.id === versionAId)?.name
  const versionBName = groups.flatMap((g) => g.versions).find((v) => v.id === versionBId)?.name
  const isLoading = loadingA || loadingB || loadingMeta
  const sameVersionSelected = versionAId && versionBId && versionAId === versionBId

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

      {/* Version A and B selectors */}
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

      {/* Validation warning for identical selections */}
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

      {/* Fetch error message */}
      {error && (
        <p style={{ color: "#7c1212", fontSize: "0.85rem", marginBottom: "16px" }}>
          Error: {error}
        </p>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <p
          style={{ color: "var(--ink-fade)", fontSize: "0.85rem", fontFamily: "var(--font-sans)" }}
        >
          Loading…
        </p>
      )}

      {/* Prompt user to make selections */}
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

      {/* Identical versions result */}
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

      {/* Side-by-side diff view */}
      {diff && diff.hasChanges && (
        <div>
          {/* Column headers showing version names and change summary */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {/* Version A header */}
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
              <span style={{ fontSize: "0.72rem", color: "#7c1212", opacity: 0.8 }}>
                {diff.sections.flatMap((s) => s.items).filter((i) => i.type === "removed").length}{" "}
                removed
              </span>
            </div>
            {/* Version B header */}
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
              <span style={{ fontSize: "0.72rem", color: "#7c3d12", opacity: 0.8 }}>
                {diff.sections.flatMap((s) => s.items).filter((i) => i.type === "added").length}{" "}
                added
              </span>
            </div>
          </div>

          {/* Per-section side-by-side rows */}
          {diff.sections.map((section) => (
            <SectionRow key={section.item_type_id} section={section} />
          ))}
        </div>
      )}
    </div>
  )
}
