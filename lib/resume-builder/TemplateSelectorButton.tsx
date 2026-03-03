"use client"

import { useState, useEffect, useRef } from "react"
import { RESUME_TEMPLATES } from "@/lib/resume-builder/templates"

type TemplateSelectorButtonProps = {
  selectedTemplateId: string
  onSelect: (templateId: string) => void
}

export function TemplateSelectorButton({ selectedTemplateId, onSelect }: TemplateSelectorButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const activeTemplate = RESUME_TEMPLATES.find((t) => t.id === selectedTemplateId) ?? RESUME_TEMPLATES[0]

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", justifyContent: "center" }}>

      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.35rem",
          padding: "0.3rem 0.7rem",
          borderRadius: "0.5rem",
          border: "1px solid var(--grid, #e5e7eb)",
          backgroundColor: open ? "var(--surface, #f9fafb)" : "white",
          color: "var(--ink, #111)",
          fontSize: "0.8rem",
          fontWeight: 500,
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          transition: "box-shadow 0.15s, background-color 0.15s",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 6px rgba(0,0,0,0.12)" }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.07)" }}
      >
        {/* Grid icon */}
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="5" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
          <rect x="8" y="1" width="5" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
          <rect x="1" y="8" width="5" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
          <rect x="8" y="8" width="5" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.25" />
        </svg>
        <span style={{ color: "var(--ink, #111)", fontWeight: 600 }}>{activeTemplate.name}</span>
        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s", color: "var(--ink-fade, #9ca3af)" }}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 0.5rem)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "340px",
            backgroundColor: "white",
            border: "1px solid var(--grid, #e5e7eb)",
            borderRadius: "0.875rem",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            padding: "0.875rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            zIndex: 50,
          }}
        >
          <p style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-fade, #9ca3af)", margin: "0 0 0.25rem 0.25rem" }}>
            Choose a template
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem" }}>
            {RESUME_TEMPLATES.map((template) => {
              const isActive = template.id === selectedTemplateId
              const isWip = template.description === "Coming soon"
              return (
                <button
                  key={template.id}
                  onClick={() => {
                    if (!isWip) {
                      onSelect(template.id)
                      setOpen(false)
                    }
                  }}
                  title={isWip ? "Coming soon" : template.description}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.5rem 0.25rem 0.4rem",
                    borderRadius: "0.625rem",
                    border: isActive ? "2px solid var(--accent, #4f46e5)" : "2px solid transparent",
                    backgroundColor: isActive ? "var(--accent-subtle, #ede9fe)" : "var(--surface, #f9fafb)",
                    cursor: isWip ? "default" : "pointer",
                    transition: "all 0.15s",
                    outline: "none",
                    opacity: isWip ? 0.45 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive && !isWip) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f3f4f6"
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive && !isWip) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--surface, #f9fafb)"
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: "100%", aspectRatio: "0.77", backgroundColor: "white", borderRadius: "0.35rem", border: "1px solid var(--grid, #e5e7eb)", overflow: "hidden", boxShadow: isActive ? "0 2px 6px rgba(79,70,229,0.15)" : "0 1px 3px rgba(0,0,0,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {isWip ? (
                      <span style={{ fontSize: "0.55rem", color: "var(--ink-fade, #9ca3af)", fontWeight: 600, letterSpacing: "0.05em" }}>WIP</span>
                    ) : template.id === "two-col" ? (
                      // Two-column thumbnail with green left sidebar
                      <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
                        <rect x="0" y="0" width="34" height="100" fill={isActive ? "#d1fae5" : "#eaf6ea"} />
                        <rect x="8" y="8" width="18" height="3" rx="1" fill={isActive ? "#059669" : "#34d399"} />
                        <rect x="8" y="13" width="14" height="1.5" rx="0.5" fill={isActive ? "#6ee7b7" : "#d1fae5"} />
                        <rect x="8" y="16" width="16" height="1.5" rx="0.5" fill={isActive ? "#6ee7b7" : "#d1fae5"} />
                        <rect x="8" y="22" width="12" height="2" rx="0.5" fill={isActive ? "#059669" : "#6b7280"} />
                        <rect x="8" y="26" width="18" height="1.5" rx="0.5" fill={isActive ? "#6ee7b7" : "#d1fae5"} />
                        <rect x="8" y="29" width="14" height="1.5" rx="0.5" fill={isActive ? "#6ee7b7" : "#d1fae5"} />
                        <rect x="8" y="36" width="12" height="2" rx="0.5" fill={isActive ? "#059669" : "#6b7280"} />
                        <rect x="8" y="40" width="18" height="1.5" rx="0.5" fill={isActive ? "#6ee7b7" : "#d1fae5"} />
                        <rect x="8" y="43" width="16" height="1.5" rx="0.5" fill={isActive ? "#6ee7b7" : "#d1fae5"} />
                        <rect x="40" y="8" width="18" height="2.5" rx="1" fill={isActive ? "var(--accent, #4f46e5)" : "#6b7280"} />
                        <rect x="40" y="13" width="32" height="1.5" rx="0.5" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                        <rect x="40" y="16" width="28" height="1.5" rx="0.5" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                        <rect x="40" y="22" width="18" height="2" rx="0.5" fill={isActive ? "var(--accent, #4f46e5)" : "#6b7280"} />
                        <rect x="40" y="26" width="32" height="1.5" rx="0.5" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                        <rect x="40" y="29" width="24" height="1.5" rx="0.5" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                        <rect x="40" y="32" width="28" height="1.5" rx="0.5" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                      </svg>
                    ) : template.id === "accent" ? (
                      // Modern thumbnail with blue accent on name
                      <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
                        <rect x="15" y="8" width="50" height="5" rx="1" fill={isActive ? "#1d4ed8" : "#3b82f6"} />
                        <rect x="20" y="15" width="40" height="2" rx="1" fill={isActive ? "#bfdbfe" : "#e5e7eb"} />
                        <rect x="28" y="19" width="24" height="1.5" rx="1" fill={isActive ? "#bfdbfe" : "#e5e7eb"} />
                        <rect x="8" y="26" width="18" height="2.5" rx="1" fill={isActive ? "#1d4ed8" : "#3b82f6"} />
                        <rect x="8" y="31" width="64" height="1.5" rx="0.5" fill={isActive ? "#bfdbfe" : "#e5e7eb"} />
                        <rect x="8" y="34" width="50" height="1.5" rx="0.5" fill={isActive ? "#bfdbfe" : "#e5e7eb"} />
                        <rect x="8" y="37" width="56" height="1.5" rx="0.5" fill={isActive ? "#bfdbfe" : "#e5e7eb"} />
                        <rect x="8" y="44" width="18" height="2.5" rx="1" fill={isActive ? "#1d4ed8" : "#3b82f6"} />
                        <rect x="8" y="49" width="64" height="1.5" rx="0.5" fill={isActive ? "#bfdbfe" : "#e5e7eb"} />
                        <rect x="8" y="52" width="40" height="1.5" rx="0.5" fill={isActive ? "#bfdbfe" : "#e5e7eb"} />
                        <rect x="8" y="59" width="18" height="2.5" rx="1" fill={isActive ? "#1d4ed8" : "#3b82f6"} />
                        <rect x="8" y="64" width="64" height="1.5" rx="0.5" fill={isActive ? "#bfdbfe" : "#e5e7eb"} />
                        <rect x="8" y="67" width="52" height="1.5" rx="0.5" fill={isActive ? "#bfdbfe" : "#e5e7eb"} />
                      </svg>
                    ) : (
                      // Default thumbnail (classic / modern)
                      <svg viewBox="0 0 80 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
                        <rect x="20" y="8" width="40" height="5" rx="1" fill={isActive ? "var(--accent, #4f46e5)" : "#9ca3af"} />
                        <rect x="25" y="15" width="30" height="2.5" rx="1" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                        <rect x="30" y="19" width="20" height="2" rx="1" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                        <rect x="8" y="25" width="64" height="0.75" fill={isActive ? "var(--accent, #4f46e5)" : "#9ca3af"} opacity="0.5" />
                        <rect x="8" y="30" width="18" height="2.5" rx="1" fill={isActive ? "var(--accent, #4f46e5)" : "#6b7280"} />
                        <rect x="8" y="35" width="64" height="1.5" rx="0.5" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                        <rect x="8" y="38" width="50" height="1.5" rx="0.5" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                        <rect x="8" y="41" width="56" height="1.5" rx="0.5" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                        <rect x="8" y="48" width="18" height="2.5" rx="1" fill={isActive ? "var(--accent, #4f46e5)" : "#6b7280"} />
                        <rect x="8" y="53" width="64" height="1.5" rx="0.5" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                        <rect x="8" y="56" width="40" height="1.5" rx="0.5" fill={isActive ? "#c7d2fe" : "#e5e7eb"} />
                      </svg>
                    )}
                  </div>
                  <span style={{
                    fontSize: "0.65rem",
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--accent, #4f46e5)" : "var(--ink, #111)",
                    whiteSpace: "normal",
                    textAlign: "center",
                    lineHeight: 1.3,
                    minHeight: "2.6em",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    wordBreak: "break-word",
                  }}>
                    {template.name}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}