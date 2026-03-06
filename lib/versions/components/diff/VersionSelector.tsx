import type { VersionGroup } from "@/lib/shared/types"

// Dropdown to select a version from grouped resume history
export function VersionSelector({
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
