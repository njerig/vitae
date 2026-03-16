import { z } from "zod"

export type TailoringAxes = {
  industry: number
  tone: number
  technicalDepth: number
  length: number
}

export type TailoringPromptParams = {
  industryFocus: "general" | "domain-aware" | "highly-targeted"
  toneStyle: "neutral" | "confident" | "executive"
  technicalDetail: "concise" | "balanced" | "deep"
  lengthTarget: "tight" | "standard" | "expanded"
  directives: string[]
}

const AxisValueSchema = z.number()

export const TailoringAxesSchema = z.object({
  industry: AxisValueSchema,
  tone: AxisValueSchema,
  technicalDepth: AxisValueSchema,
  length: AxisValueSchema,
})

export const DEFAULT_TAILORING_AXES: TailoringAxes = {
  industry: 0.5,
  tone: 0.5,
  technicalDepth: 0.5,
  length: 0.5,
}

function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/**
 * Buckets a value into a low, mid, or high category.
 * @param value - The value to bucket.
 * @param labels - The labels for the low, mid, and high categories.
 * @returns The low, mid, or high category.
 */
function bucket<TLow extends string, TMid extends string, THigh extends string>(
  value: number,
  labels: { low: TLow; mid: TMid; high: THigh }
): TLow | TMid | THigh {
  const normalized = clamp01(value)
  if (normalized < 0.34) return labels.low
  if (normalized < 0.67) return labels.mid
  return labels.high
}

/**
 * Normalizes the tailoring axes to be between 0 and 1.
 * @param axes - The tailoring axes to normalize.
 * @returns The normalized tailoring axes.
 */
export function normalizeTailoringAxes(axes: TailoringAxes): TailoringAxes {
  return {
    industry: clamp01(axes.industry),
    tone: clamp01(axes.tone),
    technicalDepth: clamp01(axes.technicalDepth),
    length: clamp01(axes.length),
  }
}

/**
 * Maps the tailoring axes to prompt parameters.
 * @param axes - The tailoring axes to map.
 * @returns The prompt parameters.
 */
export function mapTailoringAxesToPromptParams(axes: TailoringAxes): TailoringPromptParams {
  const parsed = TailoringAxesSchema.parse(axes)
  const normalized = normalizeTailoringAxes(parsed)

  const industryFocus = bucket(normalized.industry, {
    low: "general",
    mid: "domain-aware",
    high: "highly-targeted",
  })
  const toneStyle = bucket(normalized.tone, {
    low: "neutral",
    mid: "confident",
    high: "executive",
  })
  const technicalDetail = bucket(normalized.technicalDepth, {
    low: "concise",
    mid: "balanced",
    high: "deep",
  })
  const lengthTarget = bucket(normalized.length, {
    low: "tight",
    mid: "standard",
    high: "expanded",
  })

  return {
    industryFocus,
    toneStyle,
    technicalDetail,
    lengthTarget,
    directives: [
      `Industry focus: ${industryFocus}`,
      `Tone: ${toneStyle}`,
      `Technical detail: ${technicalDetail}`,
      `Length target: ${lengthTarget}`,
    ],
  }
}
