// __tests__/versions/SaveResumeButton.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SaveResumeButton } from '@/lib/versions/SaveResumeButton'
import toast from 'react-hot-toast'

// Mock react-hot-toast
jest.mock('react-hot-toast')

// Mock fetch
global.fetch = jest.fn()

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
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: '123', name: 'Test Resume' }),
    })
    // Suppress console.error for expected errors in tests
    jest.spyOn(console, 'error').mockImplementation(() => {})
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

  it('opens modal when button is clicked', () => {
    render(<SaveResumeButton workingState={mockWorkingState} />)
    
    const button = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(button)
    
    expect(screen.getByText('Save Resume Version')).toBeInTheDocument()
    expect(screen.getByLabelText(/resume name/i)).toBeInTheDocument()
  })

  it('closes modal when cancel is clicked', () => {
    render(<SaveResumeButton workingState={mockWorkingState} />)
    
    // Open modal
    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)
    
    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    
    // Modal should be closed
    expect(screen.queryByText('Save Resume Version')).not.toBeInTheDocument()
  })

  it('submits form with valid name and calls API', async () => {
    render(<SaveResumeButton workingState={mockWorkingState} />)
    
    // Open modal
    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)
    
    // Enter name
    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'My Test Resume' } })
    
    // Submit
    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'My Test Resume' }),
      })
    })
  })

  it('shows success toast on successful save', async () => {
    render(<SaveResumeButton workingState={mockWorkingState} />)
    
    // Open modal
    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)
    
    // Enter name and submit
    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'My Test Resume' } })
    
    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Resume "My Test Resume" saved successfully!')
    })
  })

  it('shows error toast on API failure', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    })
    
    render(<SaveResumeButton workingState={mockWorkingState} />)
    
    // Open modal
    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)
    
    // Enter name and submit
    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'My Test Resume' } })
    
    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to save resume. Please try again.')
    })
  })

  it('validates empty resume name input', async () => {
    render(<SaveResumeButton workingState={mockWorkingState} />)
    
    // Open modal
    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)
    
    // Submit without entering name
    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/resume name is required/i)).toBeInTheDocument()
    })
    
    // API should not be called
    expect(fetch).not.toHaveBeenCalled()
  })

  it('button shows loading state during save', async () => {
    // Make fetch hang
    ;(fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))
    
    render(<SaveResumeButton workingState={mockWorkingState} />)
    
    // Open modal
    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)
    
    // Enter name and submit
    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'My Test Resume' } })
    
    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)
    
    // Button should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
    })
  })

  it('closes modal after successful save', async () => {
    render(<SaveResumeButton workingState={mockWorkingState} />)
    
    // Open modal
    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)
    
    // Enter name and submit
    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'My Test Resume' } })
    
    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)
    
    // Modal should close after successful save
    await waitFor(() => {
      expect(screen.queryByText('Save Resume Version')).not.toBeInTheDocument()
    })
  })

  it('shows duplicate name error in modal without toast', async () => {
    // Mock fetch to return 409 Conflict (duplicate name)
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ 
        error: "A resume version with this name already exists. Please choose a different name." 
      }),
    })

    render(<SaveResumeButton workingState={mockWorkingState} />)
    
    // Open modal
    const openButton = screen.getByRole('button', { name: /save resume/i })
    fireEvent.click(openButton)
    
    // Enter duplicate name and submit
    const input = screen.getByLabelText(/resume name/i)
    fireEvent.change(input, { target: { value: 'Existing Resume' } })
    
    const saveButton = screen.getByRole('button', { name: /^save$/i })
    fireEvent.click(saveButton)

    // Error message should appear in modal (not as toast)
    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })

    // Modal should still be open so user can correct the name
    expect(screen.getByText('Save Resume Version')).toBeInTheDocument()

    // For 409 errors, toast should NOT be called
    expect(toast.error).not.toHaveBeenCalled()
  })
})
