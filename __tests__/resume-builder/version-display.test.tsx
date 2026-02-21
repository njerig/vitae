// __tests__/resume-builder/version-display.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import ResumeClient from '@/app/resume/resume-client'
import { useCanon } from '@/lib/canon/useCanon'
import { useWorkingState } from '@/lib/working-state/useWorkingState'

jest.mock('@/lib/canon/useCanon')
jest.mock('@/lib/working-state/useWorkingState')
jest.mock('@/lib/resume-builder/useDragState')
jest.mock('@/lib/resume-builder/useResumeSection')

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('Version Display', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    ;(useCanon as jest.Mock).mockReturnValue({
      allItems: [],
      itemTypes: [],
      loading: false,
      patch: jest.fn(),
    })

    // Updated to match new useWorkingState API
    ;(useWorkingState as jest.Mock).mockReturnValue({
      state: { sections: [] },
      loading: false,
      saving: false,
      isDirty: false,
      isSelected: jest.fn(),
      toggleItem: jest.fn(),
      updateStateLocally: jest.fn(),
      syncToBackend: jest.fn().mockResolvedValue(undefined),
      updatedAt: '2026-02-16T10:30:00.000Z',
    })

    require('@/lib/resume-builder/useDragState').useDragState = jest.fn(() => ({
      draggedItem: null,
      setDraggedItem: jest.fn(),
      draggedSection: null,
      setDraggedSection: jest.fn(),
      handleItemDragEnd: jest.fn(),
      isDragging: false,
    }))

    require('@/lib/resume-builder/useResumeSection').useResumeSections = jest.fn(() => ({
      sections: [],
      setSections: jest.fn(),
    }))
  })

  it('displays version name when provided', async () => {
    render(<ResumeClient userName="Test User" userId="user-123" versionName="Software Engineer Resume" versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.getByText('Version: Software Engineer Resume')).toBeInTheDocument()
    })
  })

  it('does not display version label when versionName is null', async () => {
    render(<ResumeClient userName="Test User" userId="user-123" versionName={null} versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.queryByText(/^Version:/)).not.toBeInTheDocument()
    })
  })

  it('displays updated timestamp', async () => {
    render(<ResumeClient userName="Test User" userId="user-123" versionName={null} versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.getByText(/Updated at:/)).toBeInTheDocument()
    })
  })

  it('formats timestamp correctly', async () => {
    render(<ResumeClient userName="Test User" userId="user-123" versionName={null} versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.getByText(/Updated at: 02\/16\/2026, \d{1,2}:\d{2} [AP]M/)).toBeInTheDocument()
    })
  })

  it('displays both version name and timestamp when both present', async () => {
    render(<ResumeClient userName="Test User" userId="user-123" versionName="My Resume" versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.getByText('Version: My Resume')).toBeInTheDocument()
      expect(screen.getByText(/Updated at:/)).toBeInTheDocument()
    })
  })

  it('shows Unsaved changes indicator when isDirty is true', async () => {
    ;(useWorkingState as jest.Mock).mockReturnValue({
      state: { sections: [] },
      loading: false,
      saving: false,
      isDirty: true,
      isSelected: jest.fn(),
      toggleItem: jest.fn(),
      updateStateLocally: jest.fn(),
      syncToBackend: jest.fn().mockResolvedValue(undefined),
      updatedAt: null,
    })

    render(<ResumeClient userName="Test User" userId="user-123" versionName={null} versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument()
    })
  })
})