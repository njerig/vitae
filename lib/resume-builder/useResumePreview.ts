"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

type UseResumePreviewArgs = {
  sections: Section[]
  profile?: {
    name?: string
    links?: ProfileLink[]
  }
  selectedTemplate?: string
}

export function useResumePreview({ sections, profile, selectedTemplate }: UseResumePreviewArgs) {
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
