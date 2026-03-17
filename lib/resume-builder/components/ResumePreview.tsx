"use client"

import { useMemo, useEffect, useRef } from "react"
import { RESUME_TEMPLATES } from "@/lib/resume-builder/templates"
export type { ResumeTemplate } from "@/lib/resume-builder/templates"
export { RESUME_TEMPLATES }
import { useResumePreviewData, useResumePreviewDom } from "@/lib/resume-builder/useResumePreview"

type Section = {
  typeName: string
  typeId: string
  items: unknown[]
}

type ProfileLink = {
  text: string
  href?: string
}

type ResumeBuilderPreviewProps = {
  sections: Section[]
  profile?: {
    name?: string
    links?: ProfileLink[]
  }
  selectedTemplate?: string
}

export function ResumePreview({ sections, profile, selectedTemplate }: ResumeBuilderPreviewProps) {
  const { svg, loading, error, errorForExistingSvg } = useResumePreviewData({
    sections,
    profile,
    selectedTemplate,
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const pageBreakPercents = useMemo(() => {
    if (!svg) return []
    const parser = new DOMParser()
    const doc = parser.parseFromString(svg, "image/svg+xml")
    const svgElement = doc.documentElement
    if (!(svgElement instanceof SVGSVGElement)) return []
    const viewBoxValue = svgElement.getAttribute("viewBox")
    const viewBoxParts = viewBoxValue
      ? viewBoxValue
          .trim()
          .split(/\s+/)
          .map((v) => Number.parseFloat(v))
      : []
    const docHeight = Number.isFinite(viewBoxParts[3]) ? viewBoxParts[3] : 792
    const pageHeightPt = 792
    const rawPageCount = docHeight / pageHeightPt
    const roundedPageCount = Math.round(rawPageCount)
    // Snap to integer page count if we're within 2% to avoids floating-point noise
    const pageCount =
      roundedPageCount >= 1 && Math.abs(rawPageCount - roundedPageCount) < 0.02
        ? roundedPageCount
        : Math.max(1, Math.floor(rawPageCount))
    // Return one percentage per inter-page gap (no entry for the last page)
    return Array.from({ length: Math.max(0, pageCount - 1) }, (_, idx) => {
      return ((idx + 1) / pageCount) * 100
    })
  }, [svg])

  useEffect(() => {
    if (containerRef.current && svg) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(svg, "image/svg+xml")
      const svgElement = doc.documentElement
      if (!(svgElement instanceof SVGSVGElement)) {
        containerRef.current.innerHTML = svg
        return
      }

      svgElement.removeAttribute("width")
      svgElement.removeAttribute("height")
      svgElement.style.width = "100%"
      svgElement.style.height = "auto"
      svgElement.style.display = "block"
      svgElement.style.background = "white"

      containerRef.current.innerHTML = ""
      containerRef.current.appendChild(svgElement)
    } else if (containerRef.current && !svg) {
      containerRef.current.innerHTML = ""
    }
  }, [svg])

  if (loading && !svg) {
    return (
      <div
        className="flex items-center justify-center min-h-96"
        style={{ backgroundColor: "#e8e8e8" }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4"></div>
          <p style={{ color: "var(--ink-fade)" }}>Generating preview...</p>
        </div>
      </div>
    )
  }

  // Show a fatal error state only when there's no prior SVG to fall back on
  if (error && !svg) {
    return (
      <div
        className="flex items-center justify-center min-h-96"
        style={{ backgroundColor: "#e8e8e8" }}
      >
        <div className="text-center">
          <p style={{ color: "var(--ink)" }} className="mb-2">
            Preview failed
          </p>
          <p style={{ color: "var(--ink-fade)" }} className="text-sm">
            {error}
          </p>
        </div>
      </div>
    )
  }

  // Empty state before the first render completes
  if (!svg) {
    return (
      <div
        className="flex items-center justify-center min-h-96"
        style={{ backgroundColor: "#e8e8e8" }}
      >
        <p style={{ color: "var(--ink-fade)" }}>Your resume preview will appear here</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Non-fatal error banner — shown over an existing SVG when a re-render fails.
          Keeps the last good preview visible so the user isn't left with a blank pane. */}
      {errorForExistingSvg && (
        <div
          className="absolute top-4 left-4 right-4 px-3 py-2 rounded-lg text-sm z-10 border"
          style={{
            backgroundColor: "var(--paper)",
            color: "var(--ink)",
            borderColor: "var(--grid)",
          }}
        >
          <div className="font-medium mb-1">Preview update failed</div>
          <div
            style={{ color: "var(--ink-fade)" }}
            className="whitespace-pre-wrap break-words text-xs"
          >
            {errorForExistingSvg}
          </div>
        </div>
      )}

      {/* Grey background */}
      <div style={{ backgroundColor: "#e8e8e8", padding: "2rem 1.5rem" }}>
        <div className="relative mx-auto w-full max-w-[8.5in]">
          {/* Container where the SVG is injected directly via the DOM effect above */}
          <div
            ref={containerRef}
            className="relative bg-white"
            style={{
              boxShadow: "0 4px 16px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
            }}
          />

          {/* Thick grey bands overlaid to simulate separate sheets */}
          {pageBreakPercents.map((top) => (
            <div
              key={top}
              className="pointer-events-none absolute left-0 right-0 z-10"
              style={{
                top: `${top}%`,
                transform: "translateY(-50%)",
                height: "24px",
                backgroundColor: "#e8e8e8",
                borderTop: "2px solid #d0d0d0",
                borderBottom: "2px solid #d0d0d0",
                boxShadow: "inset 0 3px 6px rgba(0,0,0,0.10), inset 0 -3px 6px rgba(0,0,0,0.10)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
