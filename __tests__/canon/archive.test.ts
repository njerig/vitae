/**
 * __tests__/canon/archive.test.ts
 *
 * Tests the client-side archive API functions (listArchivedItems,
 * restoreArchivedItem, permanentlyDeleteArchivedItem) against a mocked
 * fetch, following the same pattern as the existing canon/api.test.ts.
 */

import {
    listArchivedItems,
    restoreArchivedItem,
    permanentlyDeleteArchivedItem,
} from "@/lib/canon/api"
import toast from "react-hot-toast"

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
    error: jest.fn(),
    success: jest.fn(),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

// Shared fixture for an archived canon item
const archivedItem = {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    user_id: "user_123",
    item_type_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    title: "Senior Engineer",
    position: 0,
    content: { org: "Acme", role: "Engineer", start: "2023-01-01", bullets: [] },
    created_at: "2025-01-01T00:00:00.000Z",
    updated_at: "2025-06-01T00:00:00.000Z",
    deleted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
}

describe("Archive API client", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe("listArchivedItems", () => {
        it("fetches with no-store cache and returns archived items", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => [archivedItem],
            })

            const result = await listArchivedItems()
            expect(result).toEqual([archivedItem])
            expect(mockFetch).toHaveBeenCalledWith("/api/archive", { cache: "no-store" })
            expect(toast.error).not.toHaveBeenCalled()
        })

        it("returns an empty array when there are no archived items", async () => {
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] })
            await expect(listArchivedItems()).resolves.toEqual([])
        })

        it("shows toast.error and throws on HTTP error", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                statusText: "Internal Server Error",
                json: async () => ({ error: "Database error" }),
            })

            await expect(listArchivedItems()).rejects.toThrow("Database error")
            expect(toast.error).toHaveBeenCalledWith("Database error")
        })
    })

    // ─────────────────────────────────────────────────────────────
    // restoreArchivedItem
    // ─────────────────────────────────────────────────────────────

    describe("restoreArchivedItem", () => {
        it("sends POST to correct URL and returns the restored canon item", async () => {
            // The server returns the item without deleted_at (it's back in canon_items)
            const { deleted_at: _deleted, ...restoredItem } = archivedItem
            mockFetch.mockResolvedValueOnce({ ok: true, json: async () => restoredItem })

            const result = await restoreArchivedItem(archivedItem.id)
            expect(result).toEqual(restoredItem)
            expect(mockFetch).toHaveBeenCalledWith(
                `/api/archive?id=${encodeURIComponent(archivedItem.id)}`,
                { method: "POST" }
            )
        })

        it("shows toast.error when the item is not found (expired)", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: "Not Found",
                json: async () => ({ error: "Archived item not found or already expired" }),
            })

            await expect(restoreArchivedItem(archivedItem.id)).rejects.toThrow()
            expect(toast.error).toHaveBeenCalledWith("Archived item not found or already expired")
        })
    })

    // ─────────────────────────────────────────────────────────────
    // permanentlyDeleteArchivedItem
    // ─────────────────────────────────────────────────────────────

    describe("permanentlyDeleteArchivedItem", () => {
        it("sends DELETE to correct URL and resolves on 204", async () => {
            mockFetch.mockResolvedValueOnce({ ok: true, status: 204 })
            await expect(permanentlyDeleteArchivedItem(archivedItem.id)).resolves.toBeUndefined()
            expect(mockFetch).toHaveBeenCalledWith(
                `/api/archive?id=${encodeURIComponent(archivedItem.id)}`,
                { method: "DELETE" }
            )
            expect(toast.error).not.toHaveBeenCalled()
        })

        it("shows toast.error when the item is not found", async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: "Not Found",
                json: async () => ({ error: "Archived item not found" }),
            })

            await expect(permanentlyDeleteArchivedItem(archivedItem.id)).rejects.toThrow()
            expect(toast.error).toHaveBeenCalledWith("Archived item not found")
        })
    })
})
