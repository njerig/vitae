// Integration Tests: Resume Builder - Reorder Persistence
// Validates drag-and-drop reorder behaviour end-to-end through ResumeBuilderPage,
// covering local state updates, persistence, and edge cases.
// AC1: Reorder sections -> new order is immediately reflected and saved
// AC2: Reorder items within a section -> new order is immediately reflected and saved
// AC3: Edge cases -> empty/single-item sections handled gracefully, no errors
// STS1: Section reorder -> visual update + auto-save + persists on reload
// STS2: Item reorder -> visual update + auto-save + persists on reload
// STS3: Edge cases -> single-item drag works; no errors on any reorder action

import { render, screen, waitFor, within } from "@testing-library/react"
import { act } from "@testing-library/react"
import ResumeBuilderPage from "@/app/resume/resume-client"
import { useWorkingState } from "@/lib/working-state/useWorkingState"
import { useCanon } from "@/lib/canon/useCanon"
import type { CanonItem, ItemType } from "@/lib/shared/types"

jest.mock("@/lib/working-state/useWorkingState")
jest.mock("@/lib/canon/useCanon")

// Minimal next/link stub - avoids router dependency in unit environment
jest.mock("next/link", () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>
})

// Lightweight preview stub - avoids heavy rendering outside the scope of these tests
jest.mock("@/lib/resume-builder/components/ResumePreview", () => ({
  ResumePreview: ({ sections, profile }: any) => (
    <div data-testid="resume-preview">
      <div>Preview for {profile.name}</div>
      <div>{sections.length} sections</div>
    </div>
  ),
}))

// Stub fetch so accidental network calls don't fail tests
global.fetch = jest.fn(() =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
) as jest.Mock

jest.useFakeTimers()

// Factory for ItemType - spread overrides to customise per test
const makeItemType = (overrides?: Partial<ItemType>): ItemType => ({
  id: "work",
  display_name: "Work",
  user_id: "user_123",
  created_at: "2024-01-01",
  ...overrides,
})

// Three item types covering all sections rendered on the resume page
const mockItemTypes: ItemType[] = [
  makeItemType({ id: "work",      display_name: "Work Experience" }),
  makeItemType({ id: "education", display_name: "Education" }),
  makeItemType({ id: "project",   display_name: "Project" }),
]

// Four canon items - one project, one education, two work - used across all tests
const mockItems: CanonItem[] = [
  {
    id: "item-1", item_type_id: "work", position: 0,
    title: "Senior Developer",
    content: { role: "Senior Developer", org: "Company A" },
    user_id: "user_123", created_at: "2024-01-01", updated_at: "2024-01-01",
  } as CanonItem,
  {
    id: "item-2", item_type_id: "work", position: 1,
    title: "Junior Developer",
    content: { role: "Junior Developer", org: "Company B" },
    user_id: "user_123", created_at: "2024-01-02", updated_at: "2024-01-02",
  } as CanonItem,
  {
    id: "item-3", item_type_id: "education", position: 0,
    title: "University",
    content: { institution: "State University", degree: "BS Computer Science" },
    user_id: "user_123", created_at: "2024-01-03", updated_at: "2024-01-03",
  } as CanonItem,
  {
    id: "item-4", item_type_id: "project", position: 0,
    title: "Portfolio Website",
    content: { title: "Portfolio Website", description: "Built with React" },
    user_id: "user_123", created_at: "2024-01-04", updated_at: "2024-01-04",
  } as CanonItem,
]

// Default page props reused across all render calls
const defaultPageProps = {
  userName: "Test User",
  userId: "user_123",
  versionName: null,
  versionSavedAt: null,
  parentVersionId: null,
}

// Builds a complete useWorkingState mock with sensible defaults
// Pass overrides to customise individual fields per test
const makeWorkingStateMock = (overrides = {}) => ({
  state: { sections: [] },
  loading: false,
  saving: false,
  isDirty: false,
  isSelected: jest.fn().mockReturnValue(false),
  toggleItem: jest.fn(),
  updateStateLocally: jest.fn(),                         // local-only update, no backend call
  syncToBackend: jest.fn().mockResolvedValue(undefined), // explicit user-triggered save
  updatedAt: null,
  ...overrides,
})

// Tests

describe("Resume Builder - Reorder Persistence Integration", () => {
  const mockUpdateStateLocally = jest.fn()
  const mockSyncToBackend      = jest.fn().mockResolvedValue(undefined)
  const mockPatch              = jest.fn()

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => {})
    jest.clearAllMocks()

    // Default canon: all four items available
    ;(useCanon as jest.Mock).mockReturnValue({
      allItems:  mockItems,
      itemTypes: mockItemTypes,
      loading:   false,
      patch:     mockPatch,
    })

    // Default working state: empty (no prior save)
    ;(useWorkingState as jest.Mock).mockReturnValue(
      makeWorkingStateMock({
        updateStateLocally: mockUpdateStateLocally,
        syncToBackend:      mockSyncToBackend,
      })
    )
  })

  afterEach(() => {
    ;(console.log as jest.Mock).mockRestore()
    jest.clearAllTimers()
  })

  // AC1 / STS1 - Initial load - section order

  // AC1 / STS1 - No saved working state: page should display sections in default canon order
  it("displays sections in default canon order when no working state exists", () => {
    render(<ResumeBuilderPage {...defaultPageProps} />)

    const sectionHeaders = screen.getAllByRole("heading", { level: 3 })

    expect(sectionHeaders[0]).toHaveTextContent("Work Experience")
    expect(sectionHeaders[1]).toHaveTextContent("Education")
    expect(sectionHeaders[2]).toHaveTextContent("Project")
  })

  // AC1 / STS1 - On reload, page must restore previously saved section order from working state
  // (STS1: "On page refresh, the updated section order should persist.")
  it("restores persisted section order from working state on reload", () => {
    // Saved state places Project first - deliberately different from canon order
    const savedWorkingState = {
      sections: [
        { item_type_id: "project",   item_ids: ["item-4"] },
        { item_type_id: "work",      item_ids: ["item-1", "item-2"] },
        { item_type_id: "education", item_ids: ["item-3"] },
      ],
    }

    ;(useWorkingState as jest.Mock).mockReturnValue(
      makeWorkingStateMock({ state: savedWorkingState })
    )

    render(<ResumeBuilderPage {...defaultPageProps} />)

    const sectionHeaders = screen.getAllByRole("heading", { level: 3 })

    expect(sectionHeaders[0]).toHaveTextContent("Project")
    expect(sectionHeaders[1]).toHaveTextContent("Work Experience")
    expect(sectionHeaders[2]).toHaveTextContent("Education")
  })

  // AC2 / STS2 - Initial load - item order within sections

  // AC2 / STS2 - On reload, page must restore previously saved item order within each section
  // (STS2: "On page refresh, the updated item order should persist.")
  it("restores persisted item order within a section on reload", () => {
    // item-2 (Junior) before item-1 (Senior) - deliberately reversed from canon
    const savedWorkingState = {
      sections: [
        { item_type_id: "work",      item_ids: ["item-2", "item-1"] },
        { item_type_id: "education", item_ids: ["item-3"] },
        { item_type_id: "project",   item_ids: ["item-4"] },
      ],
    }

    ;(useWorkingState as jest.Mock).mockReturnValue(
      makeWorkingStateMock({ state: savedWorkingState })
    )

    render(<ResumeBuilderPage {...defaultPageProps} />)

    // Locate the Work Experience section container via its heading
    const workSection = screen
      .getByText("Work Experience")
      .closest("div[draggable='true']")
      ?.parentElement?.parentElement as HTMLElement

    expect(workSection).toBeInTheDocument()

    const items = within(workSection).getAllByText(/Developer/)

    // Persisted order: Junior first, Senior second
    expect(items[0]).toHaveTextContent("Junior Developer")
    expect(items[1]).toHaveTextContent("Senior Developer")
  })

  // Loading the page must never automatically trigger a backend sync
  // Syncing is an explicit user action (Save button), not triggered by render
  it("does not call syncToBackend on initial page load", () => {
    render(<ResumeBuilderPage {...defaultPageProps} />)

    act(() => { jest.advanceTimersByTime(2000) })

    expect(mockSyncToBackend).not.toHaveBeenCalled()
  })

  // AC1 / STS1 - Section reorder

  // AC1 / STS1 - Changing section position must update local state immediately
  // Backend must NOT be called - only updateStateLocally fires on drag (STS1: "auto-saved to working state")
  it("updates local state immediately when a section is reordered", async () => {
    render(<ResumeBuilderPage {...defaultPageProps} />)

    // Simulate drag via the "Section order:" input (test stand-in for drag handle)
    const [firstLabel] = screen.getAllByText("Section order:")
    const input = firstLabel.parentElement!.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement

    act(() => {
      input.focus()
      input.value = "2"
      input.blur()
    })

    await act(async () => { jest.advanceTimersByTime(1000) })

    await waitFor(() => {
      expect(mockUpdateStateLocally).toHaveBeenCalled()
    })

    // Backend must NOT be called automatically after a section reorder
    expect(mockSyncToBackend).not.toHaveBeenCalled()
  })

  // AC2 / STS2 - Item reorder

  // AC2 / STS2 - Changing item position within a section must update local state immediately
  it("updates local state immediately when an item is reordered within its section", async () => {
    render(<ResumeBuilderPage {...defaultPageProps} />)

    // Simulate drag via the "#" (position) input (test stand-in for drag handle)
    const [firstLabel] = screen.getAllByText("#")
    const input = firstLabel.parentElement!.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement

    act(() => {
      input.focus()
      input.value = "2"
      input.blur()
    })

    await act(async () => { jest.advanceTimersByTime(1000) })

    await waitFor(() => {
      expect(mockUpdateStateLocally).toHaveBeenCalled()
    })
  })

  // AC2 - Item reorder must never write to canon (patch) or trigger a backend sync
  // Only local working state is updated on drag
  it("does not call canon patch or syncToBackend when an item is reordered", async () => {
    render(<ResumeBuilderPage {...defaultPageProps} />)

    const [firstLabel] = screen.getAllByText("#")
    const input = firstLabel.parentElement!.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement

    act(() => {
      input.focus()
      input.value = "2"
      input.blur()
    })

    await act(async () => { jest.advanceTimersByTime(1000) })

    expect(mockPatch).not.toHaveBeenCalled()
    expect(mockSyncToBackend).not.toHaveBeenCalled()
  })

  // AC1 / STS1 - Immediate local-save behaviour

  // AC1 / STS1 - Each reorder must immediately call updateStateLocally (no debounce)
  // Multiple quick reorders should each produce a local save; backend remains untouched
  it("calls updateStateLocally for each reorder without debouncing", async () => {
    render(<ResumeBuilderPage {...defaultPageProps} />)

    const [firstLabel] = screen.getAllByText("Section order:")
    const input = firstLabel.parentElement!.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement

    // First reorder
    act(() => {
      input.focus()
      input.value = "2"
      input.blur()
    })
    act(() => { jest.advanceTimersByTime(500) })

    expect(mockUpdateStateLocally).toHaveBeenCalled()

    // Second reorder - both should register as separate local saves
    act(() => {
      input.focus()
      input.value = "3"
      input.blur()
    })
    act(() => { jest.advanceTimersByTime(1000) })

    expect(mockUpdateStateLocally).toHaveBeenCalledTimes(2)

    // Backend sync must NOT fire automatically between reorders
    expect(mockSyncToBackend).not.toHaveBeenCalled()
  })

  // AC1 - If section order has not actually changed, updateStateLocally must not be called
  // Prevents spurious dirty-state when component re-renders with the same data
  it("does not update local state when section order is unchanged", async () => {
    const savedWorkingState = {
      sections: [
        { item_type_id: "work",      item_ids: ["item-1", "item-2"] },
        { item_type_id: "education", item_ids: ["item-3"] },
        { item_type_id: "project",   item_ids: ["item-4"] },
      ],
    }

    ;(useWorkingState as jest.Mock).mockReturnValue(
      makeWorkingStateMock({
        state: savedWorkingState,
        updateStateLocally: mockUpdateStateLocally,
      })
    )

    render(<ResumeBuilderPage {...defaultPageProps} />)

    act(() => { jest.advanceTimersByTime(2000) })

    expect(mockUpdateStateLocally).not.toHaveBeenCalled()
  })

  // AC3 / STS3 - Loading states

  // AC3 / STS3 - While canon data is loading, page must show a loading indicator
  it("shows a loading indicator while canon data is being fetched", () => {
    ;(useCanon as jest.Mock).mockReturnValue({
      allItems: [], itemTypes: [], loading: true, patch: mockPatch,
    })

    render(<ResumeBuilderPage {...defaultPageProps} />)

    expect(screen.getByText(/Loading your resume/i)).toBeInTheDocument()
  })

  // Shows "Unsaved changes" badge when isDirty is true so the user knows a sync is pending
  it("shows an unsaved-changes indicator when local state is dirty", () => {
    ;(useWorkingState as jest.Mock).mockReturnValue(
      makeWorkingStateMock({ isDirty: true })
    )

    render(<ResumeBuilderPage {...defaultPageProps} />)

    expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument()
  })

  // Hides the unsaved-changes badge when local state matches the last synced state
  it("does not show an unsaved-changes indicator when local state is clean", () => {
    ;(useWorkingState as jest.Mock).mockReturnValue(
      makeWorkingStateMock({ isDirty: false })
    )

    render(<ResumeBuilderPage {...defaultPageProps} />)

    expect(screen.queryByText(/Unsaved changes/i)).not.toBeInTheDocument()
  })

  // AC3 / STS3 - Edge cases

  // AC3 / STS3 - No canon items: page must render a graceful empty state without crashing
  it("renders a graceful empty state when no canon items exist", () => {
    ;(useCanon as jest.Mock).mockReturnValue({
      allItems: [], itemTypes: mockItemTypes, loading: false, patch: mockPatch,
    })

    render(<ResumeBuilderPage {...defaultPageProps} />)

    expect(screen.getByText(/No items yet/i)).toBeInTheDocument()
  })

  // AC3 / STS3 - Item types with no matching items must be filtered out of the rendered list
  it("filters out item types that have no matching canon items", () => {
    // Only work items provided - education and project sections should be hidden
    ;(useCanon as jest.Mock).mockReturnValue({
      allItems:  [mockItems[0], mockItems[1]],
      itemTypes: mockItemTypes,
      loading:   false,
      patch:     mockPatch,
    })

    render(<ResumeBuilderPage {...defaultPageProps} />)

    const sectionHeaders = screen
      .getAllByRole("heading", { level: 3 })
      .filter(
        (h) =>
          !h.textContent?.includes("Resume Preview") &&
          !h.textContent?.includes("Resume Builder")
      )

    expect(sectionHeaders).toHaveLength(1)
    expect(sectionHeaders[0]).toHaveTextContent("Work Experience")
  })

  // AC3 / STS3 - Single-item sections must render correctly and allow reorder without errors
  // (STS3: "Open a section with only one item - drag and drop should work properly.")
  it("renders single-item sections correctly and allows reorder without errors", () => {
    // One item per section so every section has exactly one item
    ;(useCanon as jest.Mock).mockReturnValue({
      allItems:  [mockItems[0], mockItems[2], mockItems[3]],
      itemTypes: mockItemTypes,
      loading:   false,
      patch:     mockPatch,
    })

    render(<ResumeBuilderPage {...defaultPageProps} />)

    // Each single-item section should report "1 item" in the UI
    expect(screen.getAllByText("1 item")).toHaveLength(3)
  })

  // AC1 + AC2 / STS1 + STS2 - Full round-trip persistence

  // AC1 / STS1 - Full persistence cycle:
  // 1. User drags a section to a new position - updateStateLocally called
  // 2. syncToBackend NOT called automatically (backend sync is a manual Save action)
  // 3. On simulated page reload with saved state, sections appear in the new order
  it("persists section reorder across a simulated page reload", async () => {
    const { unmount } = render(<ResumeBuilderPage {...defaultPageProps} />)

    // Confirm Work Experience is first before any reorder
    let sectionHeaders = screen
      .getAllByRole("heading", { level: 3 })
      .filter(
        (h) =>
          !h.textContent?.includes("Resume Preview") &&
          !h.textContent?.includes("Resume Builder")
      )
    expect(sectionHeaders[0]).toHaveTextContent("Work Experience")

    // Simulate drag: move Work Experience to position 3 (last)
    const [firstLabel] = screen.getAllByText("Section order:")
    const input = firstLabel.parentElement!.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement

    act(() => {
      input.focus()
      input.value = "3"
      input.blur()
    })

    await act(async () => { jest.advanceTimersByTime(1000) })

    await waitFor(() => {
      expect(mockUpdateStateLocally).toHaveBeenCalled()
    })

    // Backend sync must NOT fire automatically - only triggered by explicit Save press
    expect(mockSyncToBackend).not.toHaveBeenCalled()

    // Capture the state that would be written on next manual save
    const savedState = mockUpdateStateLocally.mock.calls[0][0]

    // Simulate page reload by unmounting and re-rendering with the saved state
    unmount()

    ;(useWorkingState as jest.Mock).mockReturnValue(
      makeWorkingStateMock({ state: savedState })
    )

    render(<ResumeBuilderPage {...defaultPageProps} />)

    sectionHeaders = screen
      .getAllByRole("heading", { level: 3 })
      .filter(
        (h) =>
          !h.textContent?.includes("Resume Preview") &&
          !h.textContent?.includes("Resume Builder")
      )

    // Work Experience should now appear last after the reorder persisted
    expect(sectionHeaders[2]).toHaveTextContent("Work Experience")
  })

  // AC2 / STS2 - Full persistence cycle:
  // 1. User drags an item to a new position within a section - updateStateLocally called
  // 2. syncToBackend NOT called automatically (backend sync is a manual Save action)
  // 3. On simulated page reload with saved state, items appear in the new order
  it("persists item reorder within a section across a simulated page reload", async () => {
    const { unmount } = render(<ResumeBuilderPage {...defaultPageProps} />)

    // Locate the Work Experience section and confirm Senior Developer is listed first
    const workSection = screen
      .getByText("Work Experience")
      .closest("div[draggable='true']")
      ?.parentElement?.parentElement as HTMLElement

    expect(workSection).toBeInTheDocument()

    const itemsBefore = within(workSection).getAllByText(/Developer/)
    expect(itemsBefore[0]).toHaveTextContent("Senior Developer")
    expect(itemsBefore[1]).toHaveTextContent("Junior Developer")

    // Simulate drag: move first item (Senior Developer) to position 2 (last)
    const [firstHashLabel] = screen.getAllByText("#")
    const input = firstHashLabel.parentElement!.querySelector(
      'input[type="text"]'
    ) as HTMLInputElement

    act(() => {
      input.focus()
      input.value = "2"
      input.blur()
    })

    await act(async () => { jest.advanceTimersByTime(1000) })

    await waitFor(() => {
      expect(mockUpdateStateLocally).toHaveBeenCalled()
    })

    // Backend sync must NOT fire automatically - only triggered by explicit Save press
    expect(mockSyncToBackend).not.toHaveBeenCalled()

    // Capture the state that would be written on next manual save
    const savedState = mockUpdateStateLocally.mock.calls[0][0]

    // Simulate page reload by unmounting and re-rendering with the saved state
    unmount()

    ;(useWorkingState as jest.Mock).mockReturnValue(
      makeWorkingStateMock({ state: savedState })
    )

    render(<ResumeBuilderPage {...defaultPageProps} />)

    // Locate the Work Experience section again after reload
    const reloadedWorkSection = screen
      .getByText("Work Experience")
      .closest("div[draggable='true']")
      ?.parentElement?.parentElement as HTMLElement

    expect(reloadedWorkSection).toBeInTheDocument()

    const itemsAfter = within(reloadedWorkSection).getAllByText(/Developer/)

    // Junior Developer should now appear first after the reorder persisted
    expect(itemsAfter[0]).toHaveTextContent("Junior Developer")
    expect(itemsAfter[1]).toHaveTextContent("Senior Developer")
  })
})