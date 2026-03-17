"use client"

import { FormEvent, useEffect, useState } from "react"
import { ChevronDown, ChevronRight, Sparkles } from "lucide-react"
import { DEFAULT_TAILORING_AXES, type TailoringAxes } from "../../options"

// -- Types ---------------------------------------------------------------------

type TailoringContextType = "job_description" | "audience"
type TailoringContextTexts = {
  job_description?: string
  audience?: string
}

// -- Constants -----------------------------------------------------------------

const AXIS_CONFIG = [
  {
    key: "industry",
    label: "Domain Focus",
    low: "Generalist",
    high: "Domain-specific",
  },
  {
    key: "tone",
    label: "Role Framing",
    low: "Execution-first",
    high: "Strategic-first",
  },
  {
    key: "technicalDepth",
    label: "Technical Depth",
    low: "Workflow language",
    high: "Technical language",
  },
  {
    key: "length",
    label: "Detail Level",
    low: "Concise",
    high: "Detailed",
  },
] as const

type TailoringStudioCardProps = {
  initialContextType?: TailoringContextType
  initialContextText?: string
  initialContextTexts?: TailoringContextTexts
  initialAxes?: TailoringAxes
  onSaveContext?: (payload: {
    contextType: TailoringContextType
    contextText: string
    contextTexts: {
      job_description: string
      audience: string
    }
    axes: TailoringAxes
  }) => Promise<void>
  onTailor?: (payload: {
    contextType: TailoringContextType
    contextText: string
    axes: TailoringAxes
  }) => Promise<void>
  tailoring?: boolean
  onContextChange?: (payload: {
    contextType: TailoringContextType
    contextText: string
    axes: TailoringAxes
  }) => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
  onDirtyChange?: (dirty: boolean) => void
  resetSignal?: number
}

// -- Helpers -------------------------------------------------------------------

/**
 * Checks whether two tailoring axis objects are identical.
 *
 * @param a - First axis object.
 * @param b - Second axis object.
 * @returns True when all axis values match; otherwise false.
 */
function sameAxes(a: TailoringAxes, b: TailoringAxes): boolean {
  return (
    a.industry === b.industry &&
    a.tone === b.tone &&
    a.technicalDepth === b.technicalDepth &&
    a.length === b.length
  )
}

/**
 * Maps a normalized slider value into a user-facing descriptor.
 *
 * @param value - Axis value in the range 0..1.
 * @param lowLabel - Label used when value is on the low side.
 * @param highLabel - Label used when value is on the high side.
 * @returns Descriptive label such as "Mildly generalist".
 */
function describeAxisValue(value: number, lowLabel: string, highLabel: string): string {
  if (value <= 0.2) return `Strongly ${lowLabel.toLowerCase()}`
  if (value <= 0.4) return `Mildly ${lowLabel.toLowerCase()}`
  if (value < 0.6) return "Neither"
  if (value < 0.8) return `Mildly ${highLabel.toLowerCase()}`
  return `Strongly ${highLabel.toLowerCase()}`
}

/**
 * Renders the AI tailoring control card used on the resume page.
 * Maintains separate text buffers for Job Description and Audience/Area.
 *
 * @param props - Tailoring card configuration, state flags, and callbacks.
 * @param props.initialContextType - Initially selected context mode.
 * @param props.initialContextText - Backward-compatible shared context text.
 * @param props.initialContextTexts - Optional per-mode context text values.
 * @param props.initialAxes - Initial slider values.
 * @param props.onSaveContext - Callback that persists context and axes.
 * @param props.onTailor - Callback that runs AI prioritization.
 * @param props.tailoring - True while prioritization request is in progress.
 * @param props.onContextChange - Callback fired on local context/axis edits.
 * @param props.expanded - Whether the card body is expanded.
 * @param props.onExpandedChange - Callback for expand/collapse toggle.
 * @param props.onDirtyChange - Callback that reports unsaved local edits.
 * @param props.resetSignal - Incrementing token used to reset local state.
 * @returns Tailoring Studio card JSX.
 */
export function TailoringStudioCard({
  initialContextType = "job_description",
  initialContextText = "",
  initialContextTexts,
  initialAxes = DEFAULT_TAILORING_AXES,
  onSaveContext,
  onTailor,
  tailoring = false,
  onContextChange,
  expanded,
  onExpandedChange,
  onDirtyChange,
  resetSignal = 0,
}: TailoringStudioCardProps) {
  const initialJobDescriptionText =
    initialContextTexts?.job_description ??
    (initialContextType === "job_description" ? initialContextText : "")
  const initialAudienceText =
    initialContextTexts?.audience ?? (initialContextType === "audience" ? initialContextText : "")

  const [committedContextType, setCommittedContextType] =
    useState<TailoringContextType>(initialContextType)
  const [committedJobDescriptionText, setCommittedJobDescriptionText] =
    useState(initialJobDescriptionText)
  const [committedAudienceText, setCommittedAudienceText] = useState(initialAudienceText)
  const [committedAxes, setCommittedAxes] = useState<TailoringAxes>(initialAxes)
  const [contextType, setContextType] = useState<TailoringContextType>(initialContextType)
  const [jobDescriptionText, setJobDescriptionText] = useState(initialJobDescriptionText)
  const [audienceText, setAudienceText] = useState(initialAudienceText)
  const [axes, setAxes] = useState<TailoringAxes>(initialAxes)
  const [error, setError] = useState<string | null>(null)
  const [savingContext, setSavingContext] = useState(false)

  // -- Derived Values ----------------------------------------------------------

  const contextText = contextType === "job_description" ? jobDescriptionText : audienceText

  // -- Effects -----------------------------------------------------------------

  useEffect(() => {
    setCommittedContextType(initialContextType)
    setCommittedJobDescriptionText(initialJobDescriptionText)
    setCommittedAudienceText(initialAudienceText)
    setCommittedAxes(initialAxes)
    setContextType(initialContextType)
    setJobDescriptionText(initialJobDescriptionText)
    setAudienceText(initialAudienceText)
    setAxes(initialAxes)
    setError(null)
  }, [initialAudienceText, initialAxes, initialContextType, initialJobDescriptionText, resetSignal])

  useEffect(() => {
    const dirty =
      contextType !== committedContextType ||
      jobDescriptionText.trim() !== committedJobDescriptionText.trim() ||
      audienceText.trim() !== committedAudienceText.trim() ||
      !sameAxes(axes, committedAxes)
    onDirtyChange?.(dirty)
  }, [
    audienceText,
    axes,
    committedAudienceText,
    committedAxes,
    committedJobDescriptionText,
    committedContextType,
    contextType,
    jobDescriptionText,
    onDirtyChange,
  ])

  useEffect(() => {
    onContextChange?.({ contextType, contextText, axes })
  }, [axes, contextText, contextType, onContextChange])

  // -- Handlers ----------------------------------------------------------------

  const handleSaveContext = async () => {
    if (!onSaveContext) return
    if (!contextText.trim()) {
      setError("Please provide tailoring context")
      return
    }
    setSavingContext(true)
    setError(null)
    try {
      await onSaveContext({
        contextType,
        contextText: contextText.trim(),
        contextTexts: {
          job_description: jobDescriptionText.trim(),
          audience: audienceText.trim(),
        },
        axes,
      })
      setCommittedContextType(contextType)
      setCommittedJobDescriptionText(jobDescriptionText.trim())
      setCommittedAudienceText(audienceText.trim())
      setCommittedAxes(axes)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save context")
    } finally {
      setSavingContext(false)
    }
  }

  const handleTailor = async () => {
    if (!onTailor) return
    if (!contextText.trim()) {
      setError("Please provide tailoring context")
      return
    }
    setError(null)
    await onTailor({
      contextType,
      contextText: contextText.trim(),
      axes,
    })
  }

  return (
    <div
      className="rounded-2xl border shadow-sm overflow-hidden"
      style={{ borderColor: "var(--grid)", backgroundColor: "var(--paper)" }}
    >
      <button
        type="button"
        className="w-full px-6 py-4 flex items-center justify-between border-b"
        style={{ borderColor: expanded ? "var(--grid)" : "transparent" }}
        onClick={() => onExpandedChange(!expanded)}
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold tracking-wide" style={{ color: "var(--ink)" }}>
            AI Tailoring Studio
          </span>
        </span>
        {expanded ? (
          <ChevronDown className="w-4 h-4" style={{ color: "var(--ink-light)" }} />
        ) : (
          <ChevronRight className="w-4 h-4" style={{ color: "var(--ink-light)" }} />
        )}
      </button>

      {expanded && (
        <div className="px-6 pt-4 pb-6">
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              void handleSaveContext()
            }}
            className="space-y-4"
          >
            <div>
              <div
                className="flex items-center rounded-lg border mb-2 w-fit overflow-hidden"
                style={{ borderColor: "var(--grid)" }}
              >
                <button
                  type="button"
                  onClick={() => setContextType("job_description")}
                  className="px-3 py-1.5 text-xs font-medium rounded-l-lg"
                  style={{
                    backgroundColor:
                      contextType === "job_description" ? "var(--ink)" : "var(--paper)",
                    color: contextType === "job_description" ? "var(--paper)" : "var(--ink)",
                  }}
                >
                  Job Description
                </button>
                <button
                  type="button"
                  onClick={() => setContextType("audience")}
                  className="px-3 py-1.5 text-xs font-medium rounded-r-lg"
                  style={{
                    backgroundColor: contextType === "audience" ? "var(--ink)" : "var(--paper)",
                    color: contextType === "audience" ? "var(--paper)" : "var(--ink)",
                  }}
                >
                  Audience / Area
                </button>
              </div>
              <p className="text-xs mt-2 mb-3 leading-relaxed" style={{ color: "var(--ink-fade)" }}>
                {contextType === "job_description" ? (
                  <>
                    <strong>Enter a job description</strong> to optimize bullets toward role
                    expectations and language.
                  </>
                ) : (
                  <>
                    <strong>Enter an audience or area</strong> to adapt framing for a role
                    direction.
                  </>
                )}
              </p>
              {contextType === "job_description" ? (
                <textarea
                  id="tailor-context-text"
                  value={contextText}
                  onChange={(e) => setJobDescriptionText(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="w-full px-3 py-2 border rounded resize-y"
                  style={{
                    borderColor: error ? "#dc2626" : "var(--grid)",
                    borderRadius: "var(--radius-soft)",
                    backgroundColor: "white",
                    color: "var(--ink)",
                    minHeight: "120px",
                    maxHeight: "240px",
                    fontSize: "0.875rem",
                    lineHeight: "1.6",
                  }}
                  disabled={savingContext}
                />
              ) : (
                <input
                  id="tailor-context-text"
                  type="text"
                  value={contextText}
                  onChange={(e) => setAudienceText(e.target.value)}
                  placeholder="e.g. software engineering, project management, teaching"
                  className="w-full px-3 py-2 border rounded"
                  style={{
                    borderColor: error ? "#dc2626" : "var(--grid)",
                    borderRadius: "var(--radius-soft)",
                    backgroundColor: "white",
                    color: "var(--ink)",
                    fontSize: "0.875rem",
                    lineHeight: "1.4",
                  }}
                  disabled={savingContext}
                />
              )}
            </div>

            <div
              className="border rounded-lg p-4"
              style={{ borderColor: "var(--grid)", backgroundColor: "white" }}
            >
              <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
                Tuning Controls
              </h4>
              <div className="space-y-4">
                {AXIS_CONFIG.map((axis) => (
                  <div key={axis.key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: "var(--ink)" }}>{axis.label}</span>
                      <span style={{ color: "var(--ink-fade)" }}>
                        {describeAxisValue(axes[axis.key], axis.low, axis.high)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={axes[axis.key]}
                      disabled={savingContext}
                      onChange={(e) =>
                        setAxes((prev) => ({
                          ...prev,
                          [axis.key]: Number(e.target.value),
                        }))
                      }
                      className="w-full tailor-slider"
                    />
                    <div
                      className="flex justify-between text-[11px] mt-1"
                      style={{ color: "var(--ink-light)" }}
                    >
                      <span>{axis.low}</span>
                      <span>{axis.high}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm" style={{ color: "#dc2626" }}>
                {error}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-start gap-1">
                <p className="text-[11px]" style={{ color: "var(--ink-fade)" }}>
                  Save context + sliders ↓
                </p>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={savingContext || tailoring || !contextText.trim()}
                  onClick={handleSaveContext}
                >
                  {savingContext ? "Saving Context..." : "Save Context"}
                </button>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="text-[11px] text-right" style={{ color: "var(--ink-fade)" }}>
                  Reorder selected items with AI ↓
                </p>
                <button
                  type="button"
                  className="btn-primary"
                  disabled={savingContext || tailoring || !contextText.trim()}
                  onClick={() => {
                    void handleTailor()
                  }}
                >
                  {tailoring ? "Running Prioritization..." : "Run AI Prioritization"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
