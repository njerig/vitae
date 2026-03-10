"use client"

import { useState, useEffect, FormEvent } from "react"
import { createPortal } from "react-dom"
import { Spinner } from "@/lib/shared/components/Spinner"
import type { CanonItem } from "@/lib/shared/types"

type TailorSuggestion = {
    bullets: string[]
    skills: string[]
}

type TailorItemModalProps = {
    item: CanonItem<unknown>
    typeName: string
    onAccept: (suggestion: TailorSuggestion) => Promise<void>
    onClose: () => void
    saving?: boolean
}

/**
 * Modal that lets the user paste a job description and get AI-suggested
 * rewrites for a single resume item's bullet points.
 * Shows original vs suggestion side by side with accept/reject actions.
 */
export function TailorItemModal({
    item,
    typeName,
    onAccept,
    onClose,
    saving,
}: TailorItemModalProps) {
    const [jobDescription, setJobDescription] = useState("")
    const [suggestion, setSuggestion] = useState<TailorSuggestion | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Disable body scroll when modal is open
    useEffect(() => {
        const originalOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            document.body.style.overflow = originalOverflow
        }
    }, [])

    const content = (item.content ?? {}) as Record<string, unknown>
    const originalBullets = Array.isArray(content.bullets)
        ? (content.bullets as string[])
        : []
    const originalSkills = Array.isArray(content.skills)
        ? (content.skills as string[])
        : []

    const handleGenerate = async (e: FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!jobDescription.trim()) {
            setError("Please paste a job description")
            return
        }

        setLoading(true)
        try {
            const res = await fetch("/api/tailor/item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    job_description: jobDescription.trim(),
                    item: {
                        id: item.id,
                        title: item.title,
                        type_name: typeName,
                        content: item.content,
                    },
                }),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(typeof err.error === "string" ? err.error : "Tailoring failed")
            }

            const data = await res.json()
            setSuggestion(data.suggestion)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Tailoring failed")
        } finally {
            setLoading(false)
        }
    }

    const handleAccept = async () => {
        if (!suggestion) return
        await onAccept(suggestion)
    }

    return createPortal(
        <div className="modal-overlay" onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 100 }}>
            <div
                className="modal"
                style={{ maxWidth: "700px", width: "100%" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <h3
                    className="text-xl font-semibold mb-1"
                    style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
                >
                    AI Tailor: {item.title}
                </h3>
                <p className="text-sm mb-5" style={{ color: "var(--ink-fade)" }}>
                    Paste a job description and AI will rewrite this item&apos;s bullet points to better match the role.
                </p>

                {/* Job description input — always visible */}
                <form onSubmit={handleGenerate}>
                    <div className="mb-4">
                        <label
                            htmlFor="tailor-item-jd"
                            className="block text-sm font-medium mb-2"
                            style={{ color: "var(--ink)" }}
                        >
                            Job Description
                        </label>
                        <textarea
                            id="tailor-item-jd"
                            value={jobDescription}
                            onChange={(e) => {
                                setJobDescription(e.target.value)
                                // Reset suggestion when user changes the job description
                                if (suggestion) setSuggestion(null)
                            }}
                            placeholder="Paste the full job description here..."
                            disabled={loading || saving}
                            autoFocus
                            className="w-full px-3 py-2 border rounded resize-y"
                            style={{
                                borderColor: error ? "#dc2626" : "var(--grid)",
                                borderRadius: "var(--radius-soft)",
                                fontFamily: "var(--font-sans)",
                                minHeight: "100px",
                                maxHeight: "200px",
                                fontSize: "0.875rem",
                                lineHeight: "1.6",
                            }}
                        />
                    </div>

                    {error && (
                        <p className="text-sm mb-4" style={{ color: "#dc2626" }}>
                            {error}
                        </p>
                    )}

                    {/* Generate button — only show when no suggestion yet */}
                    {!suggestion && (
                        <div className="flex justify-end mb-6">
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={loading || !jobDescription.trim()}
                            >
                                {loading ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <Spinner size={24} color="white" inline />
                                        Generating...
                                    </span>
                                ) : (
                                    "Generate Suggestion"
                                )}
                            </button>
                        </div>
                    )}
                </form>

                {/* Side-by-side comparison */}
                {suggestion && (
                    <div className="mt-2">
                        <div
                            className="grid gap-4 mb-5"
                            style={{ gridTemplateColumns: "1fr 1fr" }}
                        >
                            {/* Original */}
                            <div
                                className="rounded-lg p-4"
                                style={{
                                    backgroundColor: "var(--paper-dark)",
                                    border: "1px solid var(--grid)",
                                }}
                            >
                                <p
                                    className="text-xs font-semibold uppercase mb-3"
                                    style={{ color: "var(--ink-fade)" }}
                                >
                                    Original
                                </p>
                                {originalBullets.length > 0 ? (
                                    <ul className="space-y-2">
                                        {originalBullets.map((b, i) => (
                                            <li
                                                key={i}
                                                className="text-sm flex items-start gap-2"
                                                style={{ color: "var(--ink)" }}
                                            >
                                                <span style={{ color: "var(--ink-light)" }}>•</span>
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm" style={{ color: "var(--ink-fade)" }}>
                                        No bullet points
                                    </p>
                                )}
                                {originalSkills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {originalSkills.map((s, i) => (
                                            <span key={i} className="card-token">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* AI Suggestion */}
                            <div
                                className="rounded-lg p-4"
                                style={{
                                    backgroundColor: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                }}
                            >
                                <p
                                    className="text-xs font-semibold uppercase mb-3"
                                    style={{ color: "#16a34a" }}
                                >
                                    AI Suggestion
                                </p>
                                {suggestion.bullets.length > 0 ? (
                                    <ul className="space-y-2">
                                        {suggestion.bullets.map((b, i) => (
                                            <li
                                                key={i}
                                                className="text-sm flex items-start gap-2"
                                                style={{ color: "var(--ink)" }}
                                            >
                                                <span style={{ color: "#16a34a" }}>•</span>
                                                <span>{b}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm" style={{ color: "var(--ink-fade)" }}>
                                        No bullet points suggested
                                    </p>
                                )}
                                {suggestion.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                        {suggestion.skills.map((s, i) => (
                                            <span
                                                key={i}
                                                className="px-2 py-0.5 text-xs rounded-full"
                                                style={{
                                                    backgroundColor: "#dcfce7",
                                                    color: "#16a34a",
                                                    border: "1px solid #bbf7d0",
                                                }}
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Accept / Reject / Regenerate actions */}
                        <div className="flex gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => setSuggestion(null)}
                                className="btn-secondary"
                                disabled={saving}
                            >
                                Try Again
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-secondary"
                                disabled={saving}
                            >
                                Reject
                            </button>
                            <button
                                type="button"
                                onClick={handleAccept}
                                className="btn-primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                        <Spinner size={16} color="white" inline />
                                        Saving...
                                    </span>
                                ) : (
                                    "Accept & Save"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Close button when no suggestion shown yet */}
                {!suggestion && (
                    <div className="flex justify-start">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}