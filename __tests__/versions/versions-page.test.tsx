// __tests__/versions/versions-page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VersionsClient from '@/app/versions/versions-client'
import toast from 'react-hot-toast'

// Mock react-hot-toast
jest.mock('react-hot-toast')

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('Versions Page', () => {
  const mockVersions = [
    {
      id: 'version-1',
      user_id: 'user-123',
      name: 'My First Resume',
      snapshot: { sections: [] },
      created_at: '2026-01-15T10:30:00.000Z',
    },
    {
      id: 'version-2',
      user_id: 'user-123',
      name: 'Software Engineer Resume',
      snapshot: { sections: [] },
      created_at: '2026-02-01T14:45:00.000Z',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window.confirm
    global.confirm = jest.fn(() => true)
    // Suppress console.error for expected errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Loading State', () => {
    it('renders loading spinner while fetching', () => {
      // Mock fetch to hang
      mockFetch.mockImplementation(() => new Promise(() => {}))

      render(<VersionsClient userName="Test User" userId="user-123" />)

      expect(screen.getByText('Loading your saved resumes...')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('displays empty state message when no versions exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('No saved resumes yet. Create one from the Resume Builder!')).toBeInTheDocument()
      expect(screen.getByText('Go to Resume Builder')).toBeInTheDocument()
    })

    it('renders link to resume builder in empty state', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      const link = screen.getByText('Go to Resume Builder').closest('a')
      expect(link).toHaveAttribute('href', '/resume')
    })
  })

  describe('Versions List Display', () => {
    it('renders version cards with correct data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('My First Resume')).toBeInTheDocument()
      expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument()
    })

    it('displays correct number of versions', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      expect(deleteButtons).toHaveLength(2)
    })

    it('formats and displays creation dates', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      // Check that formatted dates are displayed (look for a specific date pattern)
      expect(screen.getByText(/January 15, 2026/)).toBeInTheDocument()
      expect(screen.getByText(/February 1, 2026/)).toBeInTheDocument()
    })
  })

  describe('Delete Functionality', () => {
    it('delete button triggers confirmation dialog', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      expect(global.confirm).toHaveBeenCalledWith('Delete "My First Resume"? This action cannot be undone.')
    })

    it('calls DELETE API with correct version ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/versions?id=version-1', {
          method: 'DELETE',
        })
      })
    })

    it('removes version from list after successful deletion', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('My First Resume')).toBeInTheDocument()

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.queryByText('My First Resume')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument()
    })

    it('does not delete if user cancels confirmation', async () => {
      global.confirm = jest.fn(() => false)

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      expect(global.confirm).toHaveBeenCalled()

      // Version should still be in the list
      expect(screen.getByText('My First Resume')).toBeInTheDocument()

      // DELETE API should not be called
      const deleteCalls = mockFetch.mock.calls.filter(call => call[1]?.method === 'DELETE')
      expect(deleteCalls).toHaveLength(0)
    })

    it('shows error toast on delete failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to delete resume')
      })
    })

    it('shows success toast after successful deletion', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockVersions,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Delete')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('"My First Resume" deleted successfully')
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error toast when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to load saved resumes')
      })
    })
  })
})
