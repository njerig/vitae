import type { TailoringAxes, TailoringPromptParams } from "@/lib/tailor/options"

type RewritePromptInput = {
  baseText: string
  jobDescription?: string
  axes: TailoringAxes
  params: TailoringPromptParams
}

export function buildRewritePrompt({
  baseText,
  jobDescription,
  axes,
  params,
}: RewritePromptInput): string {
  return `You are a resume tailoring assistant.

Rewrite the provided resume text according to the requested tailoring controls.
Preserve factual accuracy. Do not invent projects, roles, companies, dates, or skills.
Output plain text only (no markdown, no bullets unless already implied by the source style).

TAILORING AXES (0 to 1):
- industry: ${axes.industry}
- tone: ${axes.tone}
- technicalDepth: ${axes.technicalDepth}
- length: ${axes.length}

MAPPED DIRECTIVES:
- ${params.directives.join("\n- ")}

${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n` : ""}SOURCE RESUME TEXT:
${baseText}

Return only the rewritten text.`
}
