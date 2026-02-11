/**
 * Integration tests for checkbox select/deselect flow.
 * Verifies UI interaction, state updates, and API calls.
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useWorkingState } from "@/lib/working-state/useWorkingState"
import { act } from "react"

// Mock fetch
const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

// Simple test component that uses the hook
function TestComponent() {
  const { isSelected, toggleItem, loading } = useWorkingState()
  
  if (loading) return <div>Loading...</div>
  
  return (
    <div>
      <input
        type="checkbox"
        data-testid="checkbox-item-1"
        checked={isSelected("item-1")}
        onChange={() => toggleItem("item-1", "type-1")}
      />
      <input
        type="checkbox"
        data-testid="checkbox-item-2"
        checked={isSelected("item-2")}
        onChange={() => toggleItem("item-2", "type-1")}
      />
    </div>
  )
}

describe("Select/Deselect Integration Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("loads initial state from API on mount", async () => {
    const initialState = {
      state: {
        sections: [
          {
            item_type_id: "type-1",
            item_ids: ["item-1"]
          }
        ]
      },
      updated_at: "2026-02-07T00:00:00.000Z"
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialState),
    })

    render(<TestComponent />)

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })

    // Check that GET was called
    expect(mockFetch).toHaveBeenCalledWith("/api/working-state")

    // Verify checkbox reflects loaded state
    const checkbox1 = screen.getByTestId("checkbox-item-1") as HTMLInputElement
    const checkbox2 = screen.getByTestId("checkbox-item-2") as HTMLInputElement
    
    expect(checkbox1.checked).toBe(true)  // item-1 was in initial state
    expect(checkbox2.checked).toBe(false) // item-2 was not
  })

  it("toggles checkbox and saves to API when clicked", async () => {
    // Initial state: empty
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ state: { sections: [] }, updated_at: "2026-02-07T00:00:00.000Z" }),
    })

    render(<TestComponent />)

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })

    const checkbox1 = screen.getByTestId("checkbox-item-1") as HTMLInputElement
    expect(checkbox1.checked).toBe(false)

    // Mock the PUT response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        state: { 
          sections: [{ item_type_id: "type-1", item_ids: ["item-1"] }] 
        },
        updated_at: "2026-02-07T00:00:00.000Z" 
      }),
    })

    // Click the checkbox
    await act(async () => {
      await userEvent.click(checkbox1)
    })

    // Wait for state update
    await waitFor(() => {
      expect(checkbox1.checked).toBe(true)
    })

    // Verify PUT was called with correct data
    await waitFor(() => {
      const putCall = mockFetch.mock.calls.find(call => call[1]?.method === "PUT")
      expect(putCall).toBeDefined()
      expect(putCall[0]).toBe("/api/working-state")
      const body = JSON.parse(putCall[1].body)
      expect(body.sections).toHaveLength(1)
      expect(body.sections[0].item_ids).toContain("item-1")
    })
  })

  it("unchecks checkbox and updates API when clicked again", async () => {
    // Initial state: item-1 selected
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        state: { 
          sections: [{ item_type_id: "type-1", item_ids: ["item-1"] }] 
        },
        updated_at: "2026-02-07T00:00:00.000Z" 
      }),
    })

    render(<TestComponent />)

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })

    const checkbox1 = screen.getByTestId("checkbox-item-1") as HTMLInputElement
    expect(checkbox1.checked).toBe(true)

    // Mock the PUT response (empty after unchecking)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        state: { sections: [] },
        updated_at: "2026-02-07T00:00:00.000Z" 
      }),
    })

    // Click to uncheck
    await act(async () => {
      await userEvent.click(checkbox1)
    })

    // Wait for state update
    await waitFor(() => {
      expect(checkbox1.checked).toBe(false)
    })

    // Verify PUT was called with empty sections
    await waitFor(() => {
      const putCall = mockFetch.mock.calls.find(call => call[1]?.method === "PUT")
      expect(putCall).toBeDefined()
      const body = JSON.parse(putCall[1].body)
      expect(body.sections).toHaveLength(0)
    })
  })

  it("handles multiple checkboxes independently", async () => {
    // Initial state: empty
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ state: { sections: [] }, updated_at: "2026-02-07T00:00:00.000Z" }),
    })

    render(<TestComponent />)

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })

    const checkbox1 = screen.getByTestId("checkbox-item-1") as HTMLInputElement
    const checkbox2 = screen.getByTestId("checkbox-item-2") as HTMLInputElement

    // Both start unchecked
    expect(checkbox1.checked).toBe(false)
    expect(checkbox2.checked).toBe(false)

    // Check first checkbox
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        state: { sections: [{ item_type_id: "type-1", item_ids: ["item-1"] }] },
        updated_at: "2026-02-07T00:00:00.000Z" 
      }),
    })

    await act(async () => {
      await userEvent.click(checkbox1)
    })

    await waitFor(() => {
      expect(checkbox1.checked).toBe(true)
      expect(checkbox2.checked).toBe(false)
    })

    // Check second checkbox
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ 
        state: { sections: [{ item_type_id: "type-1", item_ids: ["item-1", "item-2"] }] },
        updated_at: "2026-02-07T00:00:00.000Z" 
      }),
    })

    await act(async () => {
      await userEvent.click(checkbox2)
    })

    await waitFor(() => {
      expect(checkbox1.checked).toBe(true)
      expect(checkbox2.checked).toBe(true)
    })
  })
})
