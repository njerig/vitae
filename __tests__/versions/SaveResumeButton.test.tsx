// __tests__/versions/SaveResumeButton.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SaveResumeButton } from '@/lib/versions/SaveResumeButton'
import toast from 'react-hot-toast'

// Mock react-hot-toast
jest.mock('react-hot-toast')

// Mock next/navigation to prevent router.push from throwing
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// Mock fetch
global.fetch = jest.fn()

// Helper: mock groups response for the modal's group fetch
const mockGroupsResponse = (groups = []) => {
  return {
    ok: true,
    json: async () => groups,
  }
}

const sampleGroups = [
  {
    resume_group_id: 'group-1',
    group_name: 'SWE Resume',
    versions: [
      {
        id: 'version-1',
        user_id: 'user-123',
        resume_group_id: 'group-1',
        parent_version_id: null,
        name: 'SWE Resume',
        snapshot: { sections: [] },
        created_at: '2026-01-15T10:30:00.000Z',
      },
    ],
  },
]

describe('SaveResumeButton', () => {
  const mockWorkingState = {
    sections: [
      {
        item_type_id: 'type-1',
        item_ids: ['item-1', 'item-2'],
      },
    ],
  }

  const emptyWorkingState = {
    sections: [],
  }

  const emptyItemsWorkingState = {
    sections: [
      {
        item_type_id: 'type-1',
        item_ids: [],
      },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => { })
  })

  it('renders button with correct text', () => {
    render(<SaveResumeButton workingState={mockWorkingState} />)
    expect(screen.getByRole('button', { name: /save resume/i })).toBeInTheDocument()
  })

  it('button is disabled when working state is empty (no sections)', () => {
    render(<SaveResumeButton workingState={emptyWorkingState} />)
    const button = screen.getByRole('button', { name: /save resume/i })
    expect(button).toBeDisabled()
  })

  it('button is disabled when working state has no items', () => {
    render(<SaveResumeButton workingState={emptyItemsWorkingState} />)
    const button = screen.getByRole('button', { name: /save resume/i })
    expect(button).toBeDisabled()
  })

  it('button is enabled when working state has items', () => {
    render(<SaveResumeButton workingState={mockWorkingState} />)
    const button = screen.getByRole('button', { name: /save resume/i })
    expect(button).not.toBeDisabled()
  })

  it('opens modal when button is clicked', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const button = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/resume name/i)).toBeInTheDocument()
  })

  it('shows "Save To" dropdown with existing groups', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse(sampleGroups))

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/save to/i)).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/save to/i)
    expect(select).toBeInTheDocument()

    // Should have "New Resume" as default option
    const options = select.querySelectorAll('option')
    expect(options[0]).toHaveTextContent('New Resume')
    expect(options[1]).toHaveTextContent('SWE Resume')
  })

  it('closes modal when cancel is clicked', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(screen.queryByText('Save Resume Version')).not.toBeInTheDocument()
  })

  it('submits with null parent_version_id when "New Resume" is selected', async () => {
    // First call: fetch groups for modal
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse(sampleGroups))
      // Second call: save version
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'Test Resume', resume_group_id: 'new-group', parent_version_id: null }),
      })

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/save to/i)).toBeInTheDocument()
    })

    // "New Resume" is the default — just enter name and save
    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'My New Resume' } })

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: 'My New Resume', name: '', parent_version_id: null }),
      })
    })
  })

  it('submits with parent_version_id when an existing group is selected', async () => {
    // First call: fetch groups for modal
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse(sampleGroups))
      // Second call: save version
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '456', name: 'SWE Resume v2', resume_group_id: 'group-1', parent_version_id: 'version-1' }),
      })

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/save to/i)).toBeInTheDocument()
    })

    // Select existing group
    const select = screen.getByLabelText(/save to/i)
    fireEvent.change(select, { target: { value: 'group-1' } })

    // Enter version note (resume name input is hidden for existing groups)
    const input = screen.getByLabelText(/version note/i)
    fireEvent.change(input, { target: { value: 'SWE Resume v2' } })

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: undefined, name: 'SWE Resume v2', parent_version_id: 'version-1' }),
      })
    })
  })

  it('shows success toast on successful save', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'Test', resume_group_id: 'g1', parent_version_id: null }),
      })

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'My Test Resume' } })

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Resume "My Test Resume" saved successfully!')
    })
  })

  it('shows error toast on API failure', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))
      ; (fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 })

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'My Test Resume' } })

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save resume. Please try again.')
    })
  })

  it('validates empty resume name input', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/resume name is required/i)).toBeInTheDocument()
    })

    // API should not be called (only the groups fetch)
    const saveCalls = (fetch as jest.Mock).mock.calls.filter((c: string[]) => c[1]?.method === 'POST')
    expect(saveCalls).toHaveLength(0)
  })

  it('button shows loading state during save', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))
      // Make the save call hang
      ; (fetch as jest.Mock).mockImplementationOnce(() => new Promise(() => { }))

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'My Test Resume' } })

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
    })
  })

  it('closes modal after successful save', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'Test', resume_group_id: 'g1', parent_version_id: null }),
      })

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'My Test Resume' } })

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.queryByText('Save Resume Version')).not.toBeInTheDocument()
    })
  })

  it('shows duplicate name error in modal without toast', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))
      ; (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: "A resume version with this name already exists. Please choose a different name."
        }),
      })

    render(<SaveResumeButton workingState={mockWorkingState} />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'Existing Resume' } })

    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      // The 409 error is shown inline in the modal, not via toast
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })

    // Modal stays open
    expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    // No toast for duplicate name errors
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('pre-selects group when parentVersionId is provided', async () => {
    ; (fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse(sampleGroups))

    render(<SaveResumeButton workingState={mockWorkingState} parentVersionId="version-1" />)

    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)

    // Wait for groups to load and the matching group to be pre-selected
    await waitFor(() => {
      const options = screen.getAllByRole('option')
      expect(options.length).toBeGreaterThan(1)
    })

    await waitFor(() => {
      const select = screen.getByLabelText(/save to/i) as HTMLSelectElement
      expect(select.value).toBe('group-1')
    })
  })
})