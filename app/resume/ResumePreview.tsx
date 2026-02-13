"use client"

import { useMemo, useState, useEffect, useRef } from "react"

type Section = {
  typeName: string
  typeId: string
  items: unknown[]
}

type ProfileLink = {
  text: string
  href?: string
}

type ResumePreviewProps = {
  sections: Section[]
  profile?: {
    name?: string
    contact?: string
    links?: ProfileLink[]
  }
}

export function ResumePreview({ sections, profile }: ResumePreviewProps) {
  const [svg, setSvg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [errorForExistingSvg, setErrorForExistingSvg] = useState<string | null>(null)
  const [pageBreakPercents, setPageBreakPercents] = useState<number[]>([])
  const [viewerHeight, setViewerHeight] = useState(560)
  const rootRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const requestSeq = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const hasSvgRef = useRef(false)

  const data = useMemo(() => {
    return {
      profile: {
        name: profile?.name,
        contact: profile?.contact,
        links: profile?.links,
      },
      sections,
    }
  }, [profile, sections])

  useEffect(() => {
    hasSvgRef.current = Boolean(svg)
    if (containerRef.current && svg) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(svg, "image/svg+xml")
      const svgElement = doc.documentElement
      if (!(svgElement instanceof SVGSVGElement)) {
        containerRef.current.innerHTML = svg
        setPageBreakPercents([])
        return
      }

      const viewBoxValue = svgElement.getAttribute("viewBox")
      const viewBoxParts = viewBoxValue
        ? viewBoxValue
            .trim()
            .split(/\s+/)
            .map((v) => Number.parseFloat(v))
        : []
      const docHeight = Number.isFinite(viewBoxParts[3]) ? viewBoxParts[3] : 792

      // Typst pages are 11in * 72pt = 792pt tall.
      const pageHeightPt = 792
      const rawPageCount = docHeight / pageHeightPt
      const roundedPageCount = Math.round(rawPageCount)
      const pageCount =
        roundedPageCount >= 1 && Math.abs(rawPageCount - roundedPageCount) < 0.02
          ? roundedPageCount
          : Math.max(1, Math.floor(rawPageCount))

      const breaks = Array.from({ length: Math.max(0, pageCount - 1) }, (_, idx) => {
        return ((idx + 1) / pageCount) * 100
      })
      setPageBreakPercents(breaks)

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
      setPageBreakPercents([])
    }
  }, [svg])

  useEffect(() => {
    const updateViewerHeight = () => {
      if (!rootRef.current) return
      const rectTop = rootRef.current.getBoundingClientRect().top
      const bottomGap = 20
      const nextHeight = Math.floor(window.innerHeight - rectTop - bottomGap)
      setViewerHeight(Math.max(320, nextHeight))
    }

    updateViewerHeight()
    window.addEventListener("resize", updateViewerHeight)
    return () => {
      window.removeEventListener("resize", updateViewerHeight)
    }
  }, [])

  useEffect(() => {
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      void (async () => {
        const seq = ++requestSeq.current
        if (hasSvgRef.current) {
          setIsUpdating(true)
        } else {
          setLoading(true)
        }
        setError(null)

        try {
          abortRef.current?.abort()
          const controller = new AbortController()
          abortRef.current = controller

          const response = await fetch("/api/typst/compile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data }),
            signal: controller.signal,
          })

          if (!response.ok) {
            const errorData: unknown = await response.json()
            const message =
              typeof errorData === "object" &&
              errorData !== null &&
              "error" in errorData &&
              typeof (errorData as { error?: unknown }).error === "string"
                ? String((errorData as { error: string }).error)
                : "Compilation failed"
            throw new Error(message)
          }

          const text = await response.text()
          if (seq !== requestSeq.current) return
          setSvg(text)
          setError(null)
          setErrorForExistingSvg(null)
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            return
          }
          console.error("Preview compilation error:", err)
          const msg = err instanceof Error ? err.message : "Failed to generate preview"
          if (!hasSvgRef.current) {
            setError(msg)
          } else {
            setErrorForExistingSvg(msg)
          }
        } finally {
          if (seq !== requestSeq.current) return
          setLoading(false)
          setIsUpdating(false)
        }
      })()
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      abortRef.current?.abort()
    }
  }, [data])

  if (loading && !svg) {
    return (
      <div className="flex items-center justify-center h-full min-h-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4"></div>
          <p style={{ color: "var(--ink-fade)" }}>Generating preview...</p>
        </div>
      </div>
    )
  }

  if (error && !svg) {
    return (
      <div className="flex items-center justify-center h-full min-h-400px">
        <div className="text-center">
          <p style={{ color: "var(--ink)" }} className="mb-2">Preview failed</p>
          <p style={{ color: "var(--ink-fade)" }} className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center h-full min-h-400px">
        <p style={{ color: "var(--ink-fade)" }}>
          Your resume preview will appear here
        </p>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative" style={{ height: `${viewerHeight}px` }}>
      {isUpdating && (
        <div 
          className="absolute top-4 right-4 px-3 py-1 rounded-lg text-sm z-10"
          style={{ 
            backgroundColor: "var(--accent)",
            color: "var(--paper)"
          }}
        >
          Updating...
        </div>
      )}
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
          <div style={{ color: "var(--ink-fade)" }} className="whitespace-pre-wrap break-words text-xs">
            {errorForExistingSvg}
          </div>
        </div>
      )}
      <div
        className="h-full overflow-y-auto overflow-x-hidden overscroll-contain"
        style={{ backgroundColor: "#ececec", padding: "1.25rem 0.75rem" }}
      >
        <div
          className="relative mx-auto w-full max-w-[8.5in]"
          style={{ scrollSnapType: "y proximity" }}
        >
          <div
            ref={containerRef}
            className="relative bg-white shadow-sm"
            style={{ border: "1px solid #ddd", scrollSnapAlign: "start" }}
          >
            {/* SVG will be inserted here */}
          </div>
          {pageBreakPercents.map((top) => (
            <div
              key={top}
              className="pointer-events-none absolute left-0 right-0 z-10"
              style={{
                top: `${top}%`,
                transform: "translateY(-50%)",
                height: "10px",
                backgroundColor: "#ececec",
                borderTop: "1px solid #d0d0d0",
                borderBottom: "1px solid #d0d0d0",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
