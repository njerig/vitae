/**
 * Compiles a resume to SVG.
 * @param data - The data to export the resume for.
 * @param templateId - The template to export the resume for.
 * @returns The SVG for the given resume template and data.
 */
export async function compileResumeToSvg(
  data: unknown,
  templateId: string,
  signal?: AbortSignal
): Promise<string> {
  const res = await fetch("/api/resume/compile/svg", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, template_id: templateId }),
    signal,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(typeof err.error === "string" ? err.error : "Export failed")
  }
  return res.text()
}

/**
 * Compiles a resume to a PDF.
 * @param data - The data to export the resume for.
 * @param templateId - The template to export the resume for.
 * @returns The PDF for the given resume template and data.
 */
export async function compileResumeToPdf(data: unknown, templateId: string): Promise<Blob> {
  const res = await fetch("/api/resume/compile/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, template_id: templateId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(typeof err.error === "string" ? err.error : "Export failed")
  }
  return res.blob()
}
