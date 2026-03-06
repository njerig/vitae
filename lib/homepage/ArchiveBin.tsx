"use client"

import { useCallback, useEffect, useState } from "react"
import type { ArchivedCanonItem } from "@/lib/shared/types"
import { listArchivedItems, restoreArchivedItem, permanentlyDeleteArchivedItem } from "@/lib/canon/archiveApi"
import { Spinner } from "@/lib/shared/components/Spinner"
import toast from "react-hot-toast"

// How many days items are kept before automatic expiry (must match server constant)
const ARCHIVE_TTL_DAYS = 30

// Formats a deleted_at string as a human-readable relative label, e.g. "3 days ago"
function relativeTime(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return "today"
    if (diffDays === 1) return "1 day ago"
    return `${diffDays} days ago`
}

// Returns how many days remain before the item expires from the archive
function daysUntilExpiry(iso: string): number {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    return Math.max(0, ARCHIVE_TTL_DAYS - diffDays)
}

type Props = {
    //Called after an item is successfully restored so the parent can refresh its canon list. */
    onItemRestored?: () => void
}

/**
 * ArchiveBin
 *
 * Displays a collapsible list of soft-deleted canon items. Each row shows:
 *  - Item title and type hint (content keys)
 *  - When it was deleted and how many days remain before auto-expiry
 *  - "Restore" button — moves the item back to canon_items
 *  - "Delete Forever" button — permanently removes the archive row
 *
 * Auto-expiration is handled on the server-side; this component just reads
 * whatever the API returns after the server has pruned stale rows.
 */
export function ArchiveBin({ onItemRestored }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [items, setItems] = useState<ArchivedCanonItem[]>([])
    const [loading, setLoading] = useState(false)
    const [restoringId, setRestoringId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Fetch archived items when the panel is opened
    const fetchItems = useCallback(async () => {
        setLoading(true)
        try {
            const data = await listArchivedItems()
            setItems(data)
        } catch {
            toast.error("Failed to load archive")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (isOpen) void fetchItems()
    }, [isOpen, fetchItems])

    const handleRestore = async (item: ArchivedCanonItem) => {
        setRestoringId(item.id)
        try {
            await restoreArchivedItem(item.id)
            setItems((prev) => prev.filter((i) => i.id !== item.id))
            toast.success(`"${item.title || "Item"}" restored to Career History`)
            onItemRestored?.()
        } catch {
            toast.error("Failed to restore item")
        } finally {
            setRestoringId(null)
        }
    }

    const handleDeleteForever = async (item: ArchivedCanonItem) => {
        if (!confirm(`Permanently delete "${item.title || "this item"}"? This cannot be undone.`)) return
        setDeletingId(item.id)
        try {
            await permanentlyDeleteArchivedItem(item.id)
            setItems((prev) => prev.filter((i) => i.id !== item.id))
            toast.success("Item permanently deleted")
        } catch {
            toast.error("Failed to delete item")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div
            className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
        >
            {/* Collapsible header */}
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="w-full flex items-center justify-between px-8 py-5 text-left hover:bg-gray-50 transition-colors"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {/* Trash icon */}
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: "var(--ink-light)" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <div>
                        <span className="text-base font-semibold" style={{ color: "var(--ink)" }}>
                            Recently Deleted
                        </span>
                        <span className="text-sm ml-2" style={{ color: "var(--ink-fade)" }}>
                            Items auto-delete after {ARCHIVE_TTL_DAYS} days
                        </span>
                    </div>
                </div>
                {/* Chevron */}
                <svg
                    className={`w-5 h-5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    style={{ color: "var(--ink-light)" }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Content panel */}
            {isOpen && (
                <div className="border-t" style={{ borderColor: "var(--grid)" }}>
                    {loading ? (
                        <div className="flex items-center justify-center gap-3 py-10">
                            <Spinner size={20} />
                            <span className="text-sm" style={{ color: "var(--ink-fade)" }}>Loading deleted items…</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="py-10 text-center">
                            <p className="text-sm" style={{ color: "var(--ink-fade)" }}>
                                No recently deleted items.
                            </p>
                        </div>
                    ) : (
                        <ul className="divide-y" style={{ borderColor: "var(--grid)" }}>
                            {items.map((item) => {
                                const remaining = daysUntilExpiry(item.deleted_at)
                                const isRestoring = restoringId === item.id
                                const isDeleting = deletingId === item.id
                                const busy = isRestoring || isDeleting

                                return (
                                    <li key={item.id} className="px-8 py-4 flex items-center gap-4">
                                        {/* Item info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate" style={{ color: "var(--ink)" }}>
                                                {item.title || "(Untitled)"}
                                            </p>
                                            <p className="text-xs mt-0.5" style={{ color: "var(--ink-fade)" }}>
                                                Deleted {relativeTime(item.deleted_at)}
                                                {" · "}
                                                {remaining > 0 ? (
                                                    <span>Expires in {remaining} day{remaining !== 1 ? "s" : ""}</span>
                                                ) : (
                                                    <span className="text-red-500">Expiring soon</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => void handleRestore(item)}
                                                disabled={busy}
                                                className="card-action-edit flex items-center gap-1.5"
                                                title="Restore this item to your Career History"
                                            >
                                                {isRestoring ? <Spinner size={12} inline /> : null}
                                                {isRestoring ? "Restoring…" : "Restore"}
                                            </button>
                                            <button
                                                onClick={() => void handleDeleteForever(item)}
                                                disabled={busy}
                                                className="card-action-delete flex items-center gap-1.5"
                                                title="Permanently delete — cannot be undone"
                                            >
                                                {isDeleting ? <Spinner size={12} inline /> : null}
                                                {isDeleting ? "Deleting…" : "Delete Forever"}
                                            </button>
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}
