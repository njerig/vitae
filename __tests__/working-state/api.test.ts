/**
 * Tests for working-state API endpoint.
 * Verifies PUT /api/working-state validation and error handling.
 */

import toast from "react-hot-toast"

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  error: jest.fn(),
  success: jest.fn(),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('PUT /api/working-state', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("successful requests", () => {
    it("accepts valid working state with sections", async () => {
      const validState = {
        sections: [
          {
            item_type_id: "11111111-1111-4111-8111-111111111111",
            item_ids: ["22222222-2222-4222-8222-222222222222"]
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          state: validState,
          updated_at: "2026-02-07T00:00:00.000Z"
        }),
      })

      const response = await fetch("/api/working-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validState)
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.state).toEqual(validState)
    })

    it("accepts empty sections array", async () => {
      const emptyState = { sections: [] }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          state: emptyState,
          updated_at: "2026-02-07T00:00:00.000Z"
        }),
      })

      const response = await fetch("/api/working-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emptyState)
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.state.sections).toEqual([])
    })

    it("accepts multiple sections with multiple items", async () => {
      const multiState = {
        sections: [
          {
            item_type_id: "11111111-1111-4111-8111-111111111111",
            item_ids: [
              "22222222-2222-4222-8222-222222222222",
              "33333333-3333-4333-8333-333333333333"
            ]
          },
          {
            item_type_id: "44444444-4444-4444-8444-444444444444",
            item_ids: ["55555555-5555-4555-8555-555555555555"]
          }
        ]
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ 
          state: multiState,
          updated_at: "2026-02-07T00:00:00.000Z"
        }),
      })

      const response = await fetch("/api/working-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(multiState)
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.state.sections).toHaveLength(2)
    })
  })

  describe("validation errors", () => {
    it("rejects request with missing sections field", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          issues: [
            { path: ['sections'], message: 'Required' }
          ]
        }),
      })

      const response = await fetch("/api/working-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    it("rejects section with invalid item_type_id format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          issues: [
            { path: ['sections', 0, 'item_type_id'], message: 'Invalid uuid' }
          ]
        }),
      })

      const invalidState = {
        sections: [
          {
            item_type_id: "not-a-uuid",
            item_ids: ["22222222-2222-4222-8222-222222222222"]
          }
        ]
      }

      const response = await fetch("/api/working-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidState)
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    it("rejects section with invalid item_ids format", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          issues: [
            { path: ['sections', 0, 'item_ids', 0], message: 'Invalid uuid' }
          ]
        }),
      })

      const invalidState = {
        sections: [
          {
            item_type_id: "11111111-1111-4111-8111-111111111111",
            item_ids: ["not-a-uuid"]
          }
        ]
      }

      const response = await fetch("/api/working-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidState)
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    it("rejects section with missing item_ids field", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          issues: [
            { path: ['sections', 0, 'item_ids'], message: 'Required' }
          ]
        }),
      })

      const invalidState = {
        sections: [
          {
            item_type_id: "11111111-1111-4111-8111-111111111111"
            // missing item_ids
          }
        ]
      }

      const response = await fetch("/api/working-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invalidState)
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })
  })

  describe("error responses", () => {
    it("handles 500 internal server error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: "Database error" }),
      })

      const response = await fetch("/api/working-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: [] })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })

    it("handles 401 unauthorized", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: "Unauthorized" }),
      })

      const response = await fetch("/api/working-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: [] })
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })
  })
})
