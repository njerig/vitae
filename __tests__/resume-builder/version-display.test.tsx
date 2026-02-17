// __tests__/resume-builder/version-display.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import ResumeClient from '@/app/resume/resume-client'
import { useCanon } from '@/lib/canon/useCanon'
import { useWorkingState } from '@/lib/working-state/useWorkingState'

// Mock dependencies
jest.mock('@/lib/canon/useCanon')
jest.mock('@/lib/working-state/useWorkingState')
jest.mock('@/lib/resume-builder/useDragState')
jest.mock('@/lib/resume-builder/useResumeSection')

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('Version Display', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock useCanon
    ;(useCanon as jest.Mock).mockReturnValue({
      allItems: [],
      itemTypes: [],
      loading: false,
      patch: jest.fn(),
    })
    
    // Mock useWorkingState
    ;(useWorkingState as jest.Mock).mockReturnValue({
      state: { sections: [] },
      loading: false,
      saving: false,
      isSelected: jest.fn(),
      toggleItem: jest.fn(),
      saveState: jest.fn(),
      updatedAt: '2026-02-16T10:30:00.000Z',
    })
    
    // Mock useDragState
    require('@/lib/resume-builder/useDragState').useDragState = jest.fn(() => ({
      draggedItem: null,
      setDraggedItem: jest.fn(),
      draggedSection: null,
      setDraggedSection: jest.fn(),
      handleItemDragEnd: jest.fn(),
      isDragging: false,
    }))
    
    // Mock useResumeSections
    require('@/lib/resume-builder/useResumeSection').useResumeSections = jest.fn(() => ({
      sections: [],
      setSections: jest.fn(),
    }))
  })

  it('displays version name when provided', async () => {
    render(<ResumeClient userName="Test User" userId="user-123" versionName="Software Engineer Resume" />)

    await waitFor(() => {
      expect(screen.getByText('Version: Software Engineer Resume')).toBeInTheDocument()
    })
  })

  it('does not display version label when versionName is null', async () => {
    render(<ResumeClient userName="Test User" userId="user-123" versionName={null} />)

    await waitFor(() => {
      expect(screen.queryByText(/^Version:/)).not.toBeInTheDocument()
    })
  })

  it('displays last updated timestamp', async () => {
    render(<ResumeClient userName="Test User" userId="user-123" versionName={null} />)

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })
  })

  it('formats timestamp correctly', async () => {
    render(<ResumeClient userName="Test User" userId="user-123" versionName={null} />)

    await waitFor(() => {
      // The formatDate function now formats as MM/DD/YYYY, HH:MM AM/PM
      expect(screen.getByText(/Last updated: 02\/16\/2026, \d{1,2}:\d{2} [AP]M/)).toBeInTheDocument()
    })
  })

  it('displays both version name and timestamp when both present', async () => {
    render(<ResumeClient userName="Test User" userId="user-123" versionName="My Resume" />)

    await waitFor(() => {
      expect(screen.getByText('Version: My Resume')).toBeInTheDocument()
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })
  })
})
