"use client"

import { useMemo, useState } from "react"
import toast from "react-hot-toast"
import { Spinner } from "@/lib/shared/components/Spinner"
import { tailorTweakItem } from "../../api"
import type { TailoringAxes } from "../../options"

type WordDiffPart = {
  text: string
  kind: "same" | "added" | "removed"
}

/**
 * Computes a simple token-level diff via LCS to render inline additions/removals.
 *
 * @param source - Original text.
 * @param target - Suggested replacement text.
 * @returns Ordered diff parts tagged as same/added/removed.
 */
function diffWords(source: string, target: string): WordDiffPart[] {
  const a = source.trim().split(/\s+/).filter(Boolean)
  const b = target.trim().split(/\s+/).filter(Boolean)
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      if (a[i] === b[j]) {
        dp[i][j] = dp[i + 1][j + 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  const result: WordDiffPart[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      result.push({ text: a[i], kind: "same" })
      i += 1
      j += 1
      continue
    }
    if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ text: a[i], kind: "removed" })
      i += 1
    } else {
      result.push({ text: b[j], kind: "added" })
      j += 1
    }
  }

  while (i < a.length) {
    result.push({ text: a[i], kind: "removed" })
    i += 1
  }
  while (j < b.length) {
    result.push({ text: b[j], kind: "added" })
    j += 1
  }

  return result
}

type TargetItem = {
  id: string
  type_name: string
  title: string
  content: Record<string, unknown>
}

type AIItemTailorModalProps = {
  title: string
  subtitle?: string
  context?: {
    context_type: "job_description" | "audience"
    context_text: string
    axes?: TailoringAxes
  }
  items: TargetItem[]
  onApply: (overrides: { item_id: string; content?: { bullets?: string[] } }[]) => Promise<void>
  onClose: () => void
}

/**
 * Modal that generates and applies AI bullet rewrites for selected items.
 *
 * @param props - Modal configuration, target items, and callbacks.
 * @param props.title - Modal target title.
 * @param props.subtitle - Optional target subtitle.
 * @param props.context - Saved tailoring context used for generation.
 * @param props.items - Selected items to rewrite.
 * @param props.onApply - Applies generated overrides to working state.
 * @param props.onClose - Closes the modal.
 * @returns AI item tailoring modal JSX.
 */
export function AIItemTailorModal({
  title,
  subtitle,
  context,
  items,
  onApply,
  onClose,
}: AIItemTailorModalProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<
    { item_id: string; content?: { bullets?: string[] } }[]
  >([])

  const currentBulletMap = useMemo(
    () =>
      Object.fromEntries(
        items.map((item) => [
          item.id,
          Array.isArray(item.content.bullets)
            ? item.content.bullets.filter((b): b is string => typeof b === "string")
            : [],
        ])
      ),
    [items]
  )

  const runGenerate = async () => {
    if (!context?.context_text?.trim()) {
      setError("Save global AI context first, then generate item tweaks.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await tailorTweakItem({
        context_type: context.context_type,
        context_text: context.context_text,
        axes: context.axes ?? { industry: 0.5, tone: 0.5, technicalDepth: 0.5, length: 0.5 },
        items,
      })
      setSuggestions(result.overrides)
      setHasGenerated(true)
      if (result.overrides.length === 0) {
        toast("No bullet tweaks suggested")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate tweaks")
    } finally {
      setLoading(false)
    }
  }

  const applySuggestions = async () => {
    setSaving(true)
    setError(null)
    try {
      await onApply(suggestions)
      toast.success("AI tweaks applied")
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply tweaks")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold mb-1" style={{ color: "var(--ink)" }}>
          AI Tailor Item
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--ink-fade)" }}>
          Generate AI bullet tweaks and review before applying.
        </p>

        <div className="space-y-3 mb-5">
          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "var(--grid)", backgroundColor: "var(--paper-dark)" }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--ink-fade)" }}>
              Target
            </p>
            <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
              {title}
            </p>
            {subtitle && (
              <p className="text-xs mt-1" style={{ color: "var(--ink-fade)" }}>
                {subtitle}
              </p>
            )}
          </div>

          <div
            className="rounded-lg border p-3"
            style={{ borderColor: "var(--grid)", backgroundColor: "var(--paper-dark)" }}
          >
            <p className="text-xs mb-1" style={{ color: "var(--ink-fade)" }}>
              Saved tailoring context
            </p>
            <p className="text-sm" style={{ color: "var(--ink)" }}>
              {context?.context_text
                ? `${context.context_type === "job_description" ? "Job description" : "Audience"} configured`
                : "No global AI context saved yet."}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-5 max-h-[320px] overflow-y-auto">
          {items.map((item) => {
            const suggested = suggestions.find((s) => s.item_id === item.id)?.content?.bullets || []
            const current = currentBulletMap[item.id] || []
            const rowCount = Math.max(current.length, suggested.length)
            return (
              <div
                key={item.id}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--grid)" }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: "var(--ink)" }}>
                  {item.title}
                </p>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--ink-fade)" }}>
                    Word diff
                  </p>
                  <div className="space-y-2 text-xs">
                    {!hasGenerated ? (
                      <p style={{ color: "var(--ink-light)" }}>No suggestion yet</p>
                    ) : rowCount === 0 ? (
                      <p style={{ color: "var(--ink-light)" }}>No bullets</p>
                    ) : (
                      Array.from({ length: rowCount }).map((_, index) => {
                        const parts = diffWords(current[index] ?? "", suggested[index] ?? "")
                        return (
                          <p
                            key={`${item.id}-${index}`}
                            className="leading-relaxed rounded px-2 py-1"
                            style={{ backgroundColor: "var(--paper-dark)", color: "var(--ink)" }}
                          >
                            -{" "}
                            {parts.map((part, partIndex) => (
                              <span
                                key={`${item.id}-${index}-${partIndex}`}
                                style={
                                  part.kind === "added"
                                    ? { backgroundColor: "#dcfce7", color: "#166534" }
                                    : part.kind === "removed"
                                      ? {
                                          backgroundColor: "#fee2e2",
                                          color: "#991b1b",
                                          textDecoration: "line-through",
                                        }
                                      : undefined
                                }
                              >
                                {part.text}
                                {partIndex < parts.length - 1 ? " " : ""}
                              </span>
                            ))}
                          </p>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {error && (
          <p className="text-sm mb-3" style={{ color: "#dc2626" }}>
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={runGenerate}
            className="btn-secondary"
            disabled={loading || saving}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Spinner size={14} color="var(--ink)" inline />
                Generating...
              </span>
            ) : hasGenerated ? (
              "Regenerate"
            ) : (
              "Generate"
            )}
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={applySuggestions}
            disabled={saving || suggestions.length === 0}
          >
            {saving ? "Applying..." : "Apply"}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Discard
          </button>
        </div>
      </div>
    </div>
  )
}
