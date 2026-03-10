import { render, screen, waitFor } from '@testing-library/react'
import ResumeBuilderPage from '@/app/resume/resume-client'
import { useCanon } from '@/lib/canon/useCanon'
import { useWorkingState } from '@/lib/working-state/useWorkingState'

// mock all the complex data hooks so we don't need real database calls
jest.mock('@/lib/canon/useCanon')
jest.mock('@/lib/working-state/useWorkingState')
jest.mock('@/lib/resume-builder/useDragState')
jest.mock('@/lib/resume-builder/useResumeSection')

// mock fetch so we don't make real network requests just to render the header
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('Version Display', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // set up the default mock returns for our hooks before each test
    // to trick the component into thinking it successfully loaded empty data; allowing us to render the components properly
    
    ; (useCanon as jest.Mock).mockReturnValue({
      allItems: [],
      itemTypes: [],
      loading: false,
      patch: jest.fn(),
    })

    ; (useWorkingState as jest.Mock).mockReturnValue({
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

    // these internal dependencies need dummy returns so it doesn't crash
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

  it('displays version note when provided', async () => {
    render(<ResumeBuilderPage userName="Test User" userId="user-123" versionName="Updated skills section to add Python" versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.getByText('Version: Updated skills section to add Python')).toBeInTheDocument()
    })
  })

  it('does not display version label when version note is null', async () => {
    render(<ResumeBuilderPage userName="Test User" userId="user-123" versionName={null} versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.queryByText(/^Version:/)).not.toBeInTheDocument()
    })
  })

  it('displays updated timestamp', async () => {
    render(<ResumeBuilderPage userName="Test User" userId="user-123" versionName={null} versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.getByText(/Updated at:/)).toBeInTheDocument()
    })
  })

  it('formats timestamp correctly', async () => {
    render(<ResumeBuilderPage userName="Test User" userId="user-123" versionName={null} versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.getByText(/Updated at: 02\/16\/2026, \d{1,2}:\d{2} [AP]M/)).toBeInTheDocument()
    })
  })

  it('displays both version note and timestamp when both present', async () => {
    render(<ResumeBuilderPage userName="Test User" userId="user-123" versionName="My Resume Note" versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.getByText('Version: My Resume Note')).toBeInTheDocument()
      expect(screen.getByText(/Updated at:/)).toBeInTheDocument()
    })
  })

  it('shows Unsaved changes indicator when isDirty is true', async () => {

    // modify the default mock that is ran before each test to indicate that the current working state is dirty
    ; (useWorkingState as jest.Mock).mockReturnValue({
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

    render(<ResumeBuilderPage userName="Test User" userId="user-123" versionName={null} versionSavedAt={null} parentVersionId={null} />)

    await waitFor(() => {
      expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument()
    })
  })
})