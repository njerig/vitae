import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SaveResumeButton } from '@/lib/versions/components/save/SaveResumeButton'

jest.mock('react-hot-toast')

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// mock fetch so the modal can open and submit
global.fetch = jest.fn()

// mock database items
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

describe('SaveResumeButton UI flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // hide any erronuous console output
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('clicking the button opens the modal', async () => {
    // groups fetch returns empty list when the user clicks the save resume button
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] })

    render(
      <SaveResumeButton
        workingState={mockWorkingState}
        syncToBackend={jest.fn().mockResolvedValue(undefined)}
      />
    )

    // click the Save Resume button
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))

    // modal should appear
    await waitFor(() => {
      expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    })
  })

  it('can fill in the resume name and submit to a new resume', async () => {
    ;(fetch as jest.Mock)
      // this first mock resolves when the user clicks the save resume button, which triggers a GET request to load the groups
      .mockResolvedValueOnce({ ok: true, json: async () => [] })

      // this second mock waits in the queue until the user clicks save inside the modal, triggering a POST request to save the version
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '1', name: 'My Resume', resume_group_id: 'new', parent_version_id: null }) })

    render(
      <SaveResumeButton
        workingState={mockWorkingState}
        syncToBackend={jest.fn().mockResolvedValue(undefined)}
      />
    )

    // open modal
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))
    await waitFor(() => expect(screen.getByText('Save Resume Version')).toBeInTheDocument())

    // fill in the resume name field
    fireEvent.change(screen.getByLabelText(/resume name/i), { target: { value: 'My Resume' } })

    // press Save
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    // modal should close after a successful save
    await waitFor(() => {
      expect(screen.queryByText('Save Resume Version')).not.toBeInTheDocument()
    })
  })

  it('can select an existing group and submit', async () => {
    ;(fetch as jest.Mock)
      // this first mock resolves when the user clicks the save resume button, returning our fake database items
      .mockResolvedValueOnce({ ok: true, json: async () => sampleGroups })
      // this second mock waits until the user clicks save inside the modal, returning the saved version 
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: '2', name: 'v2', resume_group_id: 'group-1', parent_version_id: 'version-1' }) })

    render(
      <SaveResumeButton
        workingState={mockWorkingState}
        syncToBackend={jest.fn().mockResolvedValue(undefined)}
      />
    )

    // open modal
    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))
    await waitFor(() => expect(screen.getByLabelText(/save to/i)).toBeInTheDocument())

    // pick the existing "SWE Resume" group
    fireEvent.change(screen.getByLabelText(/save to/i), { target: { value: 'group-1' } })

    // fill in a version note
    fireEvent.change(screen.getByLabelText(/version note/i), { target: { value: 'Updated layout' } })

    // press Save
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    // modal should close
    await waitFor(() => {
      expect(screen.queryByText('Save Resume Version')).not.toBeInTheDocument()
    })
  })

  it('pressing cancel closes the modal without saving', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => [] })

    render(
      <SaveResumeButton
        workingState={mockWorkingState}
        syncToBackend={jest.fn().mockResolvedValue(undefined)}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /save resume/i }))
    await waitFor(() => expect(screen.getByText('Save Resume Version')).toBeInTheDocument())

    // cancel without saving
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByText('Save Resume Version')).not.toBeInTheDocument()
    
    // fetch should have only been called once for loading the groups initially, not for saving
    // so we filter through them to see if any POST methods appeared, which would indicate that we did save on cancel
    expect((fetch as jest.Mock).mock.calls.filter((c: any[]) => c[1]?.method === 'POST')).toHaveLength(0)
  })
})