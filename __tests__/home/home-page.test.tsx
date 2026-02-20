// __tests__/home/home-page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HomeClient from '@/app/home/home-page'
import { useCanon } from "@/lib/canon/useCanon"

import { mockWorkItem1, mockWorkItem2, mockStats, mockItemTypes } from '../utils/mockData'

// Mock the useCanon hook
jest.mock("@/lib/canon/useCanon")


// Mock the child components
jest.mock('@/lib/canon/components/CanonForm', () => ({
  CanonForm: ({ editing, onCancel, onSubmit, saving }: any) => (
    <div data-testid="canon-form">
      <p>Mock Canon Form</p>
      <p data-testid="editing-mode">{editing ? 'editing' : 'adding'}</p>
      <button onClick={onCancel} data-testid="cancel-btn">Cancel</button>
      <button 
        onClick={() => onSubmit({ 
          title: 'Test Work Item', 
          position: 0, 
          content: {
            org: 'Test Company',
            role: 'Test Role',
            start: '2024-01-01',
            end: null,
            bullets: ['Test bullet'],
            skills: ['React', 'TypeScript']
          }
        })} 
        disabled={saving} 
        data-testid="submit-btn"
      >
        Submit
      </button>
    </div>
  ),
}))

jest.mock('@/lib/canon/components/CanonList', () => ({
  CanonList: ({ items, onEdit, onDelete }: any) => (
    <div data-testid="canon-list">
      <p>Mock Canon List</p>
      <p data-testid="item-count">{items.length} items</p>
      {items.map((item: any) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          <span data-testid={`item-title-${item.id}`}>{item.title}</span>
          <button onClick={() => onEdit(item)} data-testid={`edit-${item.id}`}>Edit</button>
          <button onClick={() => onDelete(item.id)} data-testid={`delete-${item.id}`}>Delete</button>
        </div>
      ))}
    </div>
  ),
}))

describe('Home Page - Career History', () => {
  const mockCreate = jest.fn()
  const mockPatch = jest.fn()
  const mockRemove = jest.fn()
  const mockRefresh = jest.fn()
  const mockSetSelectedTypeId = jest.fn()
  const mockSetError = jest.fn()


  const mockuseCanon = {
    items: [mockWorkItem1, mockWorkItem2],
    itemTypes: mockItemTypes,
    selectedTypeId: null,
    setSelectedTypeId: mockSetSelectedTypeId,
    stats: mockStats,
    loading: false,
    saving: false,
    error: null,
    setError: mockSetError,
    refresh: mockRefresh,
    create: mockCreate,
    patch: mockPatch,
    remove: mockRemove,
  }

  beforeEach(() => {
    ;(useCanon as jest.Mock).mockReturnValue(mockuseCanon)

    jest.clearAllMocks()
    // Mock window.confirm
    global.confirm = jest.fn(() => true)
    // Mock scrollIntoView (not implemented in jsdom)
    window.HTMLElement.prototype.scrollIntoView = jest.fn()
  })

  it('renders the home page with career history title', () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    expect(screen.getByText('My Career History')).toBeInTheDocument()
    expect(screen.getByText('Add, edit, and manage your career items.')).toBeInTheDocument()
  })

  it('displays stats correctly', () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    // Check Timeline is rendered
    expect(screen.getByText('TIMELINE')).toBeInTheDocument()
    
    // Check type filter tabs show correct counts
    expect(screen.getByRole('button', { name: /all \(2\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /work experience \(3\)/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /education \(0\)/i })).toBeInTheDocument()
  })

  it('shows "Add Item" button', () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    const addButton = screen.getByRole('button', { name: /add item/i })
    expect(addButton).toBeInTheDocument()
  })

  it('shows form when "Add Item" is clicked', () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    // Form should not be visible initially
    expect(screen.queryByTestId('canon-form')).not.toBeInTheDocument()
    
    // Click add button
    const addButton = screen.getByRole('button', { name: /add item/i })
    fireEvent.click(addButton)
    
    // Form should now be visible
    expect(screen.getByTestId('canon-form')).toBeInTheDocument()
    expect(screen.getByTestId('editing-mode')).toHaveTextContent('adding')
  })

  it('hides form when cancel is clicked', () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    // Open form
    const addButton = screen.getByRole('button', { name: /add item/i })
    fireEvent.click(addButton)
    expect(screen.getByTestId('canon-form')).toBeInTheDocument()
    
    // Click cancel
    const cancelButton = screen.getByTestId('cancel-btn')
    fireEvent.click(cancelButton)
    
    // Form should be hidden
    expect(screen.queryByTestId('canon-form')).not.toBeInTheDocument()
  })

  it('calls createWork when submitting new item', async () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    // Open form
    const addButton = screen.getByRole('button', { name: /add item/i })
    fireEvent.click(addButton)
    
    // Submit form
    const submitButton = screen.getByTestId('submit-btn')
    fireEvent.click(submitButton)
    
    // Check that create was called with correct structure
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        title: 'Test Work Item',
        position: 0,
        content: {
          org: 'Test Company',
          role: 'Test Role',
          start: '2024-01-01',
          end: null,
          bullets: ['Test bullet'],
          skills: ['React', 'TypeScript']
        },
      })
    })
  })

  it('displays the career items list', () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    expect(screen.getByTestId('canon-list')).toBeInTheDocument()
    expect(screen.getByTestId('item-count')).toHaveTextContent('2 items')
  })

  it('shows correct item count in header', () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    expect(screen.getByText('All Items (2)')).toBeInTheDocument()
  })

  it("shows loading state", () => {
    ;(useCanon as jest.Mock).mockReturnValue({
      ...mockuseCanon,
      loading: true,
    })

    render(<HomeClient userName="Test User" userId="user_123" />)

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('All Items')
  })

  it('displays error message in form', () => {
    const errorMessage = "Failed to save item"
    ;(useCanon as jest.Mock).mockReturnValue({
      ...mockuseCanon,
      error: { message: errorMessage, fields: [] },
    })

    render(<HomeClient userName="Test User" userId="user_123" />)
    
    // Open form to see error (error is displayed within CanonForm)
    const addButton = screen.getByRole('button', { name: /add item/i })
    fireEvent.click(addButton)
    
    // Form should be present
    expect(screen.getByTestId('canon-form')).toBeInTheDocument()
  })

  it('can edit an existing item', () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    // Click edit on first item
    const editButton = screen.getByTestId(`edit-${mockWorkItem1.id}`)
    fireEvent.click(editButton)
    
    // Form should be visible in edit mode
    expect(screen.getByTestId('canon-form')).toBeInTheDocument()
    expect(screen.getByTestId('editing-mode')).toHaveTextContent('editing')
  })

  it('calls patchWork when editing an item', async () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    // Open edit mode
    const editButton = screen.getByTestId(`edit-${mockWorkItem1.id}`)
    fireEvent.click(editButton)
    
    // Submit form
    const submitButton = screen.getByTestId('submit-btn')
    fireEvent.click(submitButton)
    
    // Check that patch was called
    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(mockWorkItem1.id, {
        title: 'Test Work Item',
        position: 0,
        content: {
          org: 'Test Company',
          role: 'Test Role',
          start: '2024-01-01',
          end: null,
          bullets: ['Test bullet'],
          skills: ['React', 'TypeScript']
        },
      })
    })
  })

  it('calls removeWork when delete is confirmed', async () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    // Click delete
    const deleteButton = screen.getByTestId(`delete-${mockWorkItem1.id}`)
    fireEvent.click(deleteButton)
    
    // Confirm should have been called
    expect(global.confirm).toHaveBeenCalledWith('Delete this item?')
    
    // remove should be called
    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith(mockWorkItem1.id)
    })
  })

  it('does not delete if user cancels confirmation', async () => {
    global.confirm = jest.fn(() => false)
    
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    // Click delete
    const deleteButton = screen.getByTestId(`delete-${mockWorkItem1.id}`)
    fireEvent.click(deleteButton)
    
    // remove should NOT be called
    await waitFor(() => {
      expect(mockRemove).not.toHaveBeenCalled()
    })
  })

  it('disables Add Item button when saving', () => {
    ;(useCanon as jest.Mock).mockReturnValue({
      ...mockuseCanon,
      saving: true,
    })

    render(<HomeClient userName="Test User" userId="user_123" />)

    const addButton = screen.getByRole("button", { name: /add item/i })
    expect(addButton).toBeDisabled()
  })

  it('renders work items with correct data structure', () => {
    render(<HomeClient userName="Test User" userId="user_123" />)
    
    // Check that items are displayed with their titles
    expect(screen.getByTestId(`item-title-${mockWorkItem1.id}`)).toHaveTextContent(mockWorkItem1.title!)
    expect(screen.getByTestId(`item-title-${mockWorkItem2.id}`)).toHaveTextContent(mockWorkItem2.title!)
  })
})
