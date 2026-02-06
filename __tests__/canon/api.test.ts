/**
 * Tests for API error handling and toast notifications
 * Verifies that non-Zod errors show toast.error() while ValidationErrors do not
 */

import { listItemTypes, listCanonItems, createCanonItem, ValidationError } from '@/lib/canon/api'
import toast from 'react-hot-toast'

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('API error handling', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

      await expect(createCanonItem({ item_type_id: 'test-id' })).rejects.toThrow(ValidationError)
      // Toast should NOT be called for validation errors
      expect(toast.error).not.toHaveBeenCalled()
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
