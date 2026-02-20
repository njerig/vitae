// __tests__/versions/SaveResumeButton.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SaveResumeButton } from '@/lib/versions/SaveResumeButton'
import toast from 'react-hot-toast'

jest.mock('react-hot-toast')

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

global.fetch = jest.fn()

const mockGroupsResponse = (groups = []) => ({
  ok: true,
  json: async () => groups,
})

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

const mockWorkingState = {
  sections: [{ item_type_id: 'type-1', item_ids: ['item-1', 'item-2'] }],
}
const emptyWorkingState = { sections: [] }
const emptyItemsWorkingState = {
  sections: [{ item_type_id: 'type-1', item_ids: [] }],
}

const renderButton = (props: Partial<React.ComponentProps<typeof SaveResumeButton>> = {}) => {
  const syncToBackend = props.syncToBackend ?? jest.fn().mockResolvedValue(undefined)
  return render(
    <SaveResumeButton
      workingState={mockWorkingState}
      syncToBackend={syncToBackend}
      {...props}
    />
  )
}

describe('SaveResumeButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders button with correct text', () => {
    renderButton()
    expect(screen.getByRole('button', { name: /save resume/i })).toBeInTheDocument()
  })

  it('button is disabled when working state is empty (no sections)', () => {
    renderButton({ workingState: emptyWorkingState })
    expect(screen.getByRole('button', { name: /save resume/i })).toBeDisabled()
  })

  it('button is disabled when working state has no items', () => {
    renderButton({ workingState: emptyItemsWorkingState })
    expect(screen.getByRole('button', { name: /save resume/i })).toBeDisabled()
  })

  it('button is enabled when working state has items', () => {
    renderButton()
    expect(screen.getByRole('button', { name: /save resume/i })).not.toBeDisabled()
  })

  it('calls syncToBackend before opening modal', async () => {
    const syncToBackend = jest.fn().mockResolvedValue(undefined)
    ;(fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))

    renderButton({ syncToBackend })
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    expect(syncToBackend).toHaveBeenCalledTimes(1)

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })
  })

  it('opens modal after syncToBackend resolves', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/resume name/i)).toBeInTheDocument()
  })

  it('shows "Save To" dropdown with existing groups', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse(sampleGroups))

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/save to/i)).toBeInTheDocument()
    })

    const select = screen.getByLabelText(/save to/i)
    const options = select.querySelectorAll('option')
    expect(options[0]).toHaveTextContent('New Resume')
    expect(options[1]).toHaveTextContent('SWE Resume')
  })

  it('closes modal when cancel is clicked', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByText('Save Resume Version')).not.toBeInTheDocument()
  })

  it('submits with null parent_version_id when "New Resume" is selected', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(mockGroupsResponse(sampleGroups))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'Test Resume', resume_group_id: 'new-group', parent_version_id: null }),
      })

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/save to/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/resume name/i), { target: { value: 'My New Resume' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: 'My New Resume', name: '', parent_version_id: null }),
      })
    })
  })

  it('submits with parent_version_id when an existing group is selected', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(mockGroupsResponse(sampleGroups))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '456', name: 'SWE Resume v2', resume_group_id: 'group-1', parent_version_id: 'version-1' }),
      })

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByLabelText(/save to/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/save to/i), { target: { value: 'group-1' } })
    fireEvent.change(screen.getByLabelText(/version note/i), { target: { value: 'SWE Resume v2' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_name: undefined, name: 'SWE Resume v2', parent_version_id: 'version-1' }),
      })
    })
  })

  it('shows success toast on successful save', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(mockGroupsResponse([]))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'Test', resume_group_id: 'g1', parent_version_id: null }),
      })

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/resume name/i), { target: { value: 'My Test Resume' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Resume "My Test Resume" saved successfully!')
    })
  })

  it('shows error toast on API failure with generic server error', async () => {
    // When the API returns a non-ok response with no error body,
    // the fallback message from SaveResumeButton is used ("Failed to save resume version")
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(mockGroupsResponse([]))
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) })

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/resume name/i), { target: { value: 'My Test Resume' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    // The API returned no error message, so the fallback "Failed to save resume version" is used
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save resume version')
    })
  })

  it('shows error toast with server message when API provides one', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(mockGroupsResponse([]))
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/resume name/i), { target: { value: 'My Test Resume' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Internal server error')
    })
  })

  it('shows network error toast when fetch throws', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(mockGroupsResponse([]))
      .mockRejectedValueOnce(new Error('Network error'))

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/resume name/i), { target: { value: 'My Test Resume' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    // Caught exception path uses the "Please try again." message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save resume. Please try again.')
    })
  })

  it('validates empty resume name input', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse([]))

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.getByText(/resume name is required/i)).toBeInTheDocument()
    })

    const saveCalls = (fetch as jest.Mock).mock.calls.filter((c: any[]) => c[1]?.method === 'POST')
    expect(saveCalls).toHaveLength(0)
  })

  it('button shows loading state during save', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(mockGroupsResponse([]))
      .mockImplementationOnce(() => new Promise(() => {}))

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/resume name/i), { target: { value: 'My Test Resume' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
    })
  })

  it('closes modal after successful save', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(mockGroupsResponse([]))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'Test', resume_group_id: 'g1', parent_version_id: null }),
      })

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/resume name/i), { target: { value: 'My Test Resume' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.queryByText('Save Resume Version')).not.toBeInTheDocument()
    })
  })

  it('shows duplicate name error in modal without toast', async () => {
    ;(fetch as jest.Mock)
      .mockResolvedValueOnce(mockGroupsResponse([]))
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({ error: 'A resume version with this name already exists. Please choose a different name.' }),
      })

    renderButton()
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/resume name/i), { target: { value: 'Existing Resume' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })

    expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it('pre-selects group when parentVersionId is provided', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce(mockGroupsResponse(sampleGroups))

    renderButton({ parentVersionId: 'version-1' })
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

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