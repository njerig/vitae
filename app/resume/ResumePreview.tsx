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
  const containerRef = useRef<HTMLDivElement>(null)
  const requestSeq = useRef(0)

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
    if (containerRef.current && svg) {
      containerRef.current.innerHTML = svg
    }
  }, [svg])

  useEffect(() => {
    const timeoutId: NodeJS.Timeout = setTimeout(() => {
      void (async () => {
        const seq = ++requestSeq.current
        if (svg) {
          setIsUpdating(true)
        } else {
          setLoading(true)
        }
        setError(null)

        try {
          const response = await fetch("/api/typst/compile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data }),
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
          console.error("Preview compilation error:", err)
          const msg = err instanceof Error ? err.message : "Failed to generate preview"
          if (!svg) {
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

    return () => clearTimeout(timeoutId)
  }, [data, svg])

  if (loading && !svg) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-4"></div>
          <p style={{ color: "var(--ink-fade)" }}>Generating preview...</p>
        </div>
      </div>
    )
  }

  if (error && !svg) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <p style={{ color: "var(--ink)" }} className="mb-2">Preview failed</p>
          <p style={{ color: "var(--ink-fade)" }} className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <p style={{ color: "var(--ink-fade)" }}>
          Your resume preview will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="relative h-full">
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
      <div className="h-full overflow-auto" ref={containerRef}>
        {/* SVG will be inserted here */}
      </div>
    </div>
  )
}
