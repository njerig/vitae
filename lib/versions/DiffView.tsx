"use client"

import type { VersionGroup } from "@/lib/shared/types"
import { useDiff } from "./components/diff/UseDiff"
import { VersionSelector } from "./components/diff/VersionSelector"
import { SectionRow } from "./components/diff/SectionRow"

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
          {/* Column headers showing version names and removed/added counts */}
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
