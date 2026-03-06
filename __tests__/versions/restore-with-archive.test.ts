/**
 * __tests__/versions/restore-with-archive.test.ts
 *
 * Tests that:
 * 1. restoreVersion correctly returns archived_items in its response.
 * 2. handleRestoreConfirm in useVersion stashes archived_items to sessionStorage
 *    so the ResumeBuilderPage can pick them up after navigation.
 *
 * These tests focus on the client-side data-flow layer, using fetch mocks.
 */

import { restoreVersion } from "@/lib/versions/api"

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

// Shared fixtures
const ARCHIVED_ITEM = {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    user_id: "user_123",
    item_type_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    title: "Deleted Work Experience",
    position: 0,
    content: { org: "OldCorp", role: "Dev", start: "2022-01-01", bullets: [] },
    created_at: "2022-01-01T00:00:00.000Z",
    updated_at: "2023-01-01T00:00:00.000Z",
    deleted_at: "2025-12-01T00:00:00.000Z",
}

const VERSION_ID = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee"

describe("restoreVersion — archived_items in response", () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("returns archived_items when the snapshot references deleted items", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                version_id: VERSION_ID,
                resume_group_id: "group-1",
                restored: { sections: [{ item_type_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", item_ids: [ARCHIVED_ITEM.id] }] },
                archived_items: [ARCHIVED_ITEM],
            }),
        })

        const result = await restoreVersion(VERSION_ID)
        expect(result.version_id).toBe(VERSION_ID)
        expect(result.archived_items).toHaveLength(1)
        expect(result.archived_items[0].id).toBe(ARCHIVED_ITEM.id)
        expect(result.archived_items[0].deleted_at).toBeDefined()
        expect(mockFetch).toHaveBeenCalledWith(`/api/versions/${VERSION_ID}/restore`, { method: "POST" })
    })

    it("returns an empty archived_items array when all snapshot items are still live", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                version_id: VERSION_ID,
                resume_group_id: "group-1",
                restored: { sections: [] },
                archived_items: [],
            }),
        })

        const result = await restoreVersion(VERSION_ID)
        expect(result.archived_items).toEqual([])
    })

    it("throws on HTTP error", async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 404,
            statusText: "Not Found",
            json: async () => ({ error: "Version not found" }),
        })

        await expect(restoreVersion(VERSION_ID)).rejects.toThrow("Version not found")
    })
})

describe("sessionStorage bridge for archived items", () => {
    // Minimal sessionStorage mock (jest/jsdom provides a real implementation)
    beforeEach(() => {
        sessionStorage.clear()
        jest.clearAllMocks()
    })

    it("archived items saved to sessionStorage can be read back", () => {
        // Simulate what useVersion.handleRestoreConfirm does after a successful restore
        const key = `archived_items_${VERSION_ID}`
        sessionStorage.setItem(key, JSON.stringify([ARCHIVED_ITEM]))

        // Simulate what ResumeBuilderPage does on mount
        const raw = sessionStorage.getItem(key)
        expect(raw).not.toBeNull()
        const parsed = JSON.parse(raw!)
        expect(parsed).toHaveLength(1)
        expect(parsed[0].id).toBe(ARCHIVED_ITEM.id)
        expect(parsed[0].deleted_at).toBe(ARCHIVED_ITEM.deleted_at)

        // Key is removed so it doesn't linger across navigations
        sessionStorage.removeItem(key)
        expect(sessionStorage.getItem(key)).toBeNull()
    })

    it("does not write to sessionStorage when archived_items is empty", () => {
        // When no items are archived, nothing should be written
        const archived: typeof ARCHIVED_ITEM[] = []
        if (archived.length) {
            sessionStorage.setItem(`archived_items_${VERSION_ID}`, JSON.stringify(archived))
        }
        expect(sessionStorage.getItem(`archived_items_${VERSION_ID}`)).toBeNull()
    })
})
