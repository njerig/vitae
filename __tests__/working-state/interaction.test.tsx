/**
 * Integration tests for checkbox select/deselect flow.
 * Verifies UI interaction and local state updates.
 *
 * NOTE: Since our refactor, toggleItem only updates local state.
 * The PUT to /api/working-state only happens when syncToBackend is
 * called explicitly (e.g. on Save Resume button press).
 * These tests verify local state behaviour and the syncToBackend path separately.
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useWorkingState } from "@/lib/working-state/useWorkingState"
import { act } from "react"

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

// Simple test component that uses the hook
function TestComponent() {
  const { isSelected, toggleItem, syncToBackend, loading } = useWorkingState()

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
      <button onClick={() => syncToBackend()} data-testid="sync-btn">
        Sync
      </button>
    </div>
  )
}

describe("Select/Deselect Integration Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "log").mockImplementation(() => {})
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  it("loads initial state from API on mount", async () => {
    const initialState = {
      state: {
        sections: [{ item_type_id: "type-1", item_ids: ["item-1"] }],
      },
      updated_at: "2026-02-07T00:00:00.000Z",
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(initialState),
    })

    render(<TestComponent />)

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledWith("/api/working-state")

    const checkbox1 = screen.getByTestId("checkbox-item-1") as HTMLInputElement
    const checkbox2 = screen.getByTestId("checkbox-item-2") as HTMLInputElement

    expect(checkbox1.checked).toBe(true)
    expect(checkbox2.checked).toBe(false)
  })

  it("toggles checkbox local state when clicked — no PUT fired", async () => {
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

    await act(async () => {
      await userEvent.click(checkbox1)
    })

    // Local state updated immediately
    await waitFor(() => {
      expect(checkbox1.checked).toBe(true)
    })

    // No PUT should have been made — toggleItem is local-only
    const putCalls = mockFetch.mock.calls.filter((c) => c[1]?.method === "PUT")
    expect(putCalls).toHaveLength(0)
  })

  it("unchecks checkbox in local state when clicked again — no PUT fired", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          state: { sections: [{ item_type_id: "type-1", item_ids: ["item-1"] }] },
          updated_at: "2026-02-07T00:00:00.000Z",
        }),
    })

    render(<TestComponent />)

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })

    const checkbox1 = screen.getByTestId("checkbox-item-1") as HTMLInputElement
    expect(checkbox1.checked).toBe(true)

    await act(async () => {
      await userEvent.click(checkbox1)
    })

    await waitFor(() => {
      expect(checkbox1.checked).toBe(false)
    })

    const putCalls = mockFetch.mock.calls.filter((c) => c[1]?.method === "PUT")
    expect(putCalls).toHaveLength(0)
  })

  it("handles multiple checkboxes independently in local state", async () => {
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

    expect(checkbox1.checked).toBe(false)
    expect(checkbox2.checked).toBe(false)

    await act(async () => {
      await userEvent.click(checkbox1)
    })

    await waitFor(() => {
      expect(checkbox1.checked).toBe(true)
      expect(checkbox2.checked).toBe(false)
    })

    await act(async () => {
      await userEvent.click(checkbox2)
    })

    await waitFor(() => {
      expect(checkbox1.checked).toBe(true)
      expect(checkbox2.checked).toBe(true)
    })
  })

  it("syncToBackend sends PUT with current local state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ state: { sections: [] }, updated_at: "2026-02-07T00:00:00.000Z" }),
    })

    render(<TestComponent />)

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })

    const checkbox1 = screen.getByTestId("checkbox-item-1") as HTMLInputElement

    // Check an item locally
    await act(async () => {
      await userEvent.click(checkbox1)
    })

    await waitFor(() => {
      expect(checkbox1.checked).toBe(true)
    })

    // Still no PUT yet
    expect(mockFetch.mock.calls.filter((c) => c[1]?.method === "PUT")).toHaveLength(0)

    // Now explicitly sync to backend
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ updated_at: "2026-02-07T00:01:00.000Z" }),
    })

    await act(async () => {
      await userEvent.click(screen.getByTestId("sync-btn"))
    })

    await waitFor(() => {
      const putCall = mockFetch.mock.calls.find((c) => c[1]?.method === "PUT")
      expect(putCall).toBeDefined()
      expect(putCall![0]).toBe("/api/working-state")
      const body = JSON.parse(putCall![1].body)
      expect(body.sections).toHaveLength(1)
      expect(body.sections[0].item_ids).toContain("item-1")
    })
  })

  it("syncToBackend sends empty sections after all items unchecked", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          state: { sections: [{ item_type_id: "type-1", item_ids: ["item-1"] }] },
          updated_at: "2026-02-07T00:00:00.000Z",
        }),
    })

    render(<TestComponent />)

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument()
    })

    const checkbox1 = screen.getByTestId("checkbox-item-1") as HTMLInputElement
    expect(checkbox1.checked).toBe(true)

    // Uncheck locally
    await act(async () => {
      await userEvent.click(checkbox1)
    })

    await waitFor(() => {
      expect(checkbox1.checked).toBe(false)
    })

    // Sync — should send empty sections
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ updated_at: "2026-02-07T00:01:00.000Z" }),
    })

    await act(async () => {
      await userEvent.click(screen.getByTestId("sync-btn"))
    })

    await waitFor(() => {
      const putCall = mockFetch.mock.calls.find((c) => c[1]?.method === "PUT")
      expect(putCall).toBeDefined()
      const body = JSON.parse(putCall![1].body)
      expect(body.sections).toHaveLength(0)
    })
  })
})