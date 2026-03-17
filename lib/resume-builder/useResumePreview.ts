"use client"

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import toast from "react-hot-toast"
import { compileResumeToSvg } from "@/lib/resume-builder/api"

type Section = {
  typeName: string
  typeId: string
  items: unknown[]
}

type ProfileLink = {
  text: string
  href?: string
}

export type UseResumePreviewDataArgs = {
  sections: Section[]
  profile?: {
    name?: string
    links?: ProfileLink[]
  }
  selectedTemplate?: string
}

export type UseResumePreviewDataResult = {
  svg: string | null
  loading: boolean
  error: string | null
  errorForExistingSvg: string | null
}

export type UseResumePreviewDomArgs = {
  svg: string | null
}

export type UseResumePreviewDomResult = {
  containerRef: RefObject<HTMLDivElement>
}

export function useResumePreviewData({
  sections,
  profile,
  selectedTemplate,
}: UseResumePreviewDataArgs): UseResumePreviewDataResult {
  const [svg, setSvg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [errorForExistingSvg, setErrorForExistingSvg] = useState<string | null>(null)

  const requestSeq = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const hasSvgRef = useRef(false)

  const activeTemplateId = selectedTemplate ?? "classic"

  const data = useMemo(() => {
    return {
      profile: {
        name: profile?.name,
        links: profile?.links,
      },
      sections,
      _templateId: activeTemplateId,
    }
  }, [profile, sections, activeTemplateId])

  useEffect(() => {
    hasSvgRef.current = Boolean(svg)
  }, [svg])

  useEffect(() => {
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      void (async () => {
        const seq = ++requestSeq.current
        if (hasSvgRef.current) {
          toast.loading("Updating preview...", { id: "preview-update" })
        } else {
          setLoading(true)
        }
        setError(null)

        try {
          abortRef.current?.abort()
          const controller = new AbortController()
          abortRef.current = controller

          const nextSvg = await compileResumeToSvg(data, activeTemplateId, controller.signal)

          if (seq !== requestSeq.current) return
          setSvg(nextSvg)
          setError(null)
          setErrorForExistingSvg(null)
          if (hasSvgRef.current) {
            toast.success("Preview updated", { id: "preview-update", duration: 1500 })
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            toast.dismiss("preview-update")
            return
          }
          console.error("Preview compilation error:", err)
          const msg = err instanceof Error ? err.message : "Failed to generate preview"
          if (!hasSvgRef.current) {
            setError(msg)
          } else {
            setErrorForExistingSvg(msg)
            toast.error("Preview update failed", { id: "preview-update" })
          }
        } finally {
          if (seq !== requestSeq.current) return
          setLoading(false)
        }
      })()
    }, 500)

    return () => {
      clearTimeout(timeoutId)
      abortRef.current?.abort()
      toast.dismiss("preview-update")
    }
  }, [data, activeTemplateId])

  return { svg, loading, error, errorForExistingSvg }
}

export function useResumePreviewDom({ svg }: UseResumePreviewDomArgs): UseResumePreviewDomResult {
  const containerRef = useRef<HTMLDivElement>(null)

  // Inject the SVG directly into the DOM rather than using dangerouslySetInnerHTML,
  // so we can strip fixed width/height attributes and make the SVG scale responsively.
  useEffect(() => {
    if (containerRef.current && svg) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(svg, "image/svg+xml")
      const svgElement = doc.documentElement
      if (!(svgElement instanceof SVGSVGElement)) {
        // Fallback: if parsing didn't yield a proper SVG element, inject raw HTML
        containerRef.current.innerHTML = svg
        return
      }

      // Remove fixed dimensions so the SVG stretches to fill its container
      svgElement.removeAttribute("width")
      svgElement.removeAttribute("height")
      svgElement.style.width = "100%"
      svgElement.style.height = "auto"
      svgElement.style.display = "block"
      svgElement.style.background = "white"

      containerRef.current.innerHTML = ""
      containerRef.current.appendChild(svgElement)
    } else if (containerRef.current && !svg) {
      // Clear the container if there's no SVG to show
      containerRef.current.innerHTML = ""
    }
  }, [svg])

  return { containerRef }
}
