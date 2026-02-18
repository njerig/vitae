// __tests__/versions/restore.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VersionsClient from '@/app/versions/versions-client'
import { RestoreConfirmModal } from '@/lib/versions/RestoreConfirmModal'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

// Mock react-hot-toast
jest.mock('react-hot-toast')

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('Version Restore Functionality', () => {
  const mockGroups = [
    {
      resume_group_id: 'group-1',
      group_name: 'My Software Engineer Resume',
      versions: [
        {
          id: 'version-1',
          user_id: 'user-123',
          resume_group_id: 'group-1',
          parent_version_id: null,
          name: 'My Software Engineer Resume',
          snapshot: { sections: [] },
          created_at: '2026-01-15T10:30:00.000Z',
        },
      ],
    },
  ]

  const mockRouter = {
    push: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
      ; (useRouter as jest.Mock).mockReturnValue(mockRouter)
    global.confirm = jest.fn(() => true)
    // Suppress console.error for expected errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  describe('RestoreConfirmModal', () => {
    it('does not render when isOpen is false', () => {
      const { container } = render(
        <RestoreConfirmModal
          isOpen={false}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          versionName="Test Version"
        />
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders when isOpen is true', () => {
      render(
        <RestoreConfirmModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          versionName="Test Version"
        />
      )
      expect(screen.getByText('Restore Version?')).toBeInTheDocument()
    })

    it('shows version name in warning message', () => {
      render(
        <RestoreConfirmModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={jest.fn()}
          versionName="My Resume v2"
        />
      )
      expect(screen.getByText(/My Resume v2/)).toBeInTheDocument()
      expect(screen.getByText(/This will replace your current draft/)).toBeInTheDocument()
    })

    it('calls onClose when Cancel clicked', () => {
      const onClose = jest.fn()
      render(
        <RestoreConfirmModal
          isOpen={true}
          onClose={onClose}
          onConfirm={jest.fn()}
          versionName="Test"
        />
      )
      fireEvent.click(screen.getByText('Cancel'))
      expect(onClose).toHaveBeenCalled()
    })

    it('calls onConfirm when Restore clicked', () => {
      const onConfirm = jest.fn()
      render(
        <RestoreConfirmModal
          isOpen={true}
          onClose={jest.fn()}
          onConfirm={onConfirm}
          versionName="Test"
        />
      )
      fireEvent.click(screen.getByText('Restore'))
      expect(onConfirm).toHaveBeenCalled()
    })

    it('closes modal when overlay clicked', () => {
      const onClose = jest.fn()
      render(
        <RestoreConfirmModal
          isOpen={true}
          onClose={onClose}
          onConfirm={jest.fn()}
          versionName="Test"
        />
      )
      const overlay = screen.getByText('Restore Version?').closest('.modal-overlay')
      if (overlay) {
        fireEvent.click(overlay)
        expect(onClose).toHaveBeenCalled()
      }
    })
  })

  describe('Restore Button in VersionCard', () => {
    it('renders restore button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      expect(screen.getByText('Restore')).toBeInTheDocument()
    })

    it('shows Restoring... when isRestoring is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      })

      // Mock restore API to hang
      mockFetch.mockImplementationOnce(() => new Promise(() => { }))

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Restore'))
      fireEvent.click(screen.getAllByText('Restore')[1]) // Click the modal confirm button

      await waitFor(() => {
        expect(screen.getByText('Restoring...')).toBeInTheDocument()
      })
    })
  })

  describe('Restore Flow', () => {
    it('opens confirmation modal when restore clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Restore'))

      expect(screen.getByText('Restore Version?')).toBeInTheDocument()
      const resumeNameMatches = screen.getAllByText(/My Software Engineer Resume/)
      expect(resumeNameMatches.length).toBeGreaterThan(0)
    })

    it('closes modal when cancel clicked', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Restore'))
      expect(screen.getByText('Restore Version?')).toBeInTheDocument()

      fireEvent.click(screen.getByText('Cancel'))

      await waitFor(() => {
        expect(screen.queryByText('Restore Version?')).not.toBeInTheDocument()
      })
    })

    it('calls restore API with correct ID when confirmed', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, version_id: 'version-1', resume_group_id: 'group-1' }),
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Restore'))
      fireEvent.click(screen.getAllByText('Restore')[1]) // Click modal confirm button

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/versions/version-1/restore', {
          method: 'POST',
        })
      })
    })

    it('redirects to /resume with version name and parentVersionId in URL on successful restore', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, version_id: 'version-1', resume_group_id: 'group-1' }),
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Restore'))
      fireEvent.click(screen.getAllByText('Restore')[1])

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith(
          expect.stringMatching(/^\/resume\?version=My%20Software%20Engineer%20Resume&savedAt=.+&parentVersionId=version-1$/)
        )
      })
    })

    it('shows success toast on successful restore', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, version_id: 'version-1', resume_group_id: 'group-1' }),
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Restore'))
      fireEvent.click(screen.getAllByText('Restore')[1])

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('"My Software Engineer Resume" restored successfully')
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error toast when restore API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Restore'))
      fireEvent.click(screen.getAllByText('Restore')[1])

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to restore version')
      })
    })

    it('does not redirect on error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      })

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Restore'))
      fireEvent.click(screen.getAllByText('Restore')[1])

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })

      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('shows error toast when network fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGroups,
      })

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      render(<VersionsClient userName="Test User" userId="user-123" />)

      await waitFor(() => {
        expect(screen.queryByText('Loading your saved resumes...')).not.toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Restore'))
      fireEvent.click(screen.getAllByText('Restore')[1])

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to restore version')
      })
    })
  })
})
