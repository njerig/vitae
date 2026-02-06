/**
 * Tests for canon API client behavior.
 * Verifies success paths, request shapes, and error handling behavior.
 */

import { createCanonItem, listCanonItems, listItemTypes, ValidationError } from "@/lib/canon/api"
import toast from "react-hot-toast"

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('API error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("successful responses", () => {
    it("returns item types and uses no-store cache", async () => {
      const itemTypes = [
        {
          id: "11111111-1111-4111-8111-111111111111",
          user_id: "user_123",
          display_name: "Work Experience",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(itemTypes),
      })

      await expect(listItemTypes()).resolves.toEqual(itemTypes)
      expect(mockFetch).toHaveBeenCalledWith("/api/item-types", { cache: "no-store" })
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("adds item_type_id query param when filtering listCanonItems", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })

      const itemTypeId = "22222222-2222-4222-8222-222222222222"
      await expect(listCanonItems(itemTypeId)).resolves.toEqual([])
      expect(mockFetch).toHaveBeenCalledWith(`/api/canon?item_type_id=${encodeURIComponent(itemTypeId)}`, { cache: "no-store" })
    })

    it("creates canon items with POST JSON payload", async () => {
      const payload = {
        item_type_id: "11111111-1111-4111-8111-111111111111",
        title: "Senior Engineer",
        position: 0,
        content: {
          org: "Acme Corp",
          role: "Senior Engineer",
          start: "2024-01-01",
          end: null,
          bullets: ["Built APIs"],
          skills: ["TypeScript"],
        },
      }
      const created = {
        id: "item-1",
        user_id: "user_123",
        ...payload,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(created),
      })

      await expect(createCanonItem(payload)).resolves.toEqual(created)
      expect(mockFetch).toHaveBeenCalledWith("/api/canon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    })
  })

  describe('HTTP errors (non-Zod)', () => {
    it('shows toast.error for HTTP 500 errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Database connection failed' }),
      })

      await expect(listItemTypes()).rejects.toThrow('Database connection failed')
      expect(toast.error).toHaveBeenCalledWith('Database connection failed')
    })

    it('shows toast.error for HTTP 401 unauthorized', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })

      await expect(listItemTypes()).rejects.toThrow('Unauthorized')
      expect(toast.error).toHaveBeenCalledWith('Unauthorized')
    })

    it('shows toast.error for HTTP 404 not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Resource not found' }),
      })

      await expect(listCanonItems()).rejects.toThrow('Resource not found')
      expect(toast.error).toHaveBeenCalledWith('Resource not found')
    })

    it('uses status text when no error message in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => Promise.resolve({}),
      })

      await expect(listItemTypes()).rejects.toThrow('HTTP 503: Service Unavailable')
      expect(toast.error).toHaveBeenCalledWith('HTTP 503: Service Unavailable')
    })
  })

  describe('Zod validation errors', () => {
    it('does NOT show toast.error for validation errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({
          issues: [
            { path: ['org'], message: 'Company is required' },
            { path: ['role'], message: 'Position is required' },
          ],
        }),
      })

      await expect(createCanonItem({ item_type_id: "test-id" })).rejects.toThrow(ValidationError)
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("extracts validation fields and formats message from issues", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () =>
          Promise.resolve({
            issues: [
              { path: ["org"], message: "Company is required" },
              { path: ["role"], message: "Position is required" },
            ],
          }),
      })

      try {
        await createCanonItem({ item_type_id: "test-id" })
        fail("Expected createCanonItem to throw ValidationError")
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError)
        const validationError = error as ValidationError
        expect(validationError.fields).toEqual(["org", "role"])
        expect(validationError.message).toContain("Company is required")
        expect(validationError.message).toContain("Position is required")
      }
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("falls back to raw field names for unknown labels", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: () =>
          Promise.resolve({
            issues: [{ path: ["institution"], message: "Institution is required" }],
          }),
      })

      try {
        await createCanonItem({ item_type_id: "test-id" })
        fail("Expected createCanonItem to throw ValidationError")
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError)
        const validationError = error as ValidationError
        expect(validationError.fields).toEqual(["institution"])
        expect(validationError.message).toContain("institution")
        expect(validationError.message).toContain("Institution is required")
      }
    })
  })

  describe('Network errors', () => {
    it('throws error when fetch fails completely', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'))

      await expect(listItemTypes()).rejects.toThrow('Failed to fetch')
      // Note: Network errors are handled in hooks, not in api.ts
    })
  })
})
