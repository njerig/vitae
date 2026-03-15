// Unit Tests: useResumeSections Hook
// Covers order validation logic and section hydration behaviour.
// AC1: Reorder sections -> sections reflect new order and save is triggered
// AC2: Reorder item within a section -> items reflect new order and save is triggered
// AC3: Edge cases in ordering -> empty/single-item sections handled gracefully

import { renderHook, act } from "@testing-library/react"
import { useResumeSections } from "@/lib/resume-builder/useResumeSection"
import type { CanonItem, ItemType } from "@/lib/shared/types"

jest.useFakeTimers()

// Factory for ItemType - spread overrides to customise per test
const makeItemType = (overrides?: Partial<ItemType>): ItemType => ({
  id: "work",
  display_name: "Work",
  user_id: "user_123",
  created_at: "2024-01-01",
  ...overrides,
})

// Two item types used as the baseline section set across most tests
const mockItemTypes: ItemType[] = [
  makeItemType({ id: "work",      display_name: "Work" }),
  makeItemType({ id: "education", display_name: "Education" }),
]

// Two work items + one education item - covers multi-section and multi-item scenarios
const mockItems: CanonItem[] = [
  { id: "item-1", item_type_id: "work",      position: 0, title: "Job A"  } as CanonItem,
  { id: "item-2", item_type_id: "work",      position: 1, title: "Job B"  } as CanonItem,
  { id: "item-3", item_type_id: "education", position: 0, title: "School" } as CanonItem,
]

// Pre-saved working state with work items deliberately reversed
// Used to verify that persisted ordering is respected on load (AC1 / AC2)
const mockWorkingState = {
  sections: [
    { item_type_id: "work",      item_ids: ["item-2", "item-1"] }, // reversed vs canon
    { item_type_id: "education", item_ids: ["item-3"] },
  ],
}

// Tests

describe("useResumeSections", () => {
  const mockSaveState = jest.fn()

  beforeEach(() => {
    // Reset call counts and return values before each test
    jest.clearAllMocks()
  })

  // AC1 / AC2 - Initial load

  // AC1 - No prior working state: sections should be derived from canon items grouped by type
  it("builds sections from canon items when no working state exists", () => {
    const { result } = renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, null, false, mockSaveState)
    )

    // Both item types should produce a section
    expect(result.current.sections).toHaveLength(2)
    // Work section contains both work items
    expect(result.current.sections[0].items).toHaveLength(2)
    // Education section contains the single education item
    expect(result.current.sections[1].items).toHaveLength(1)
  })

  // AC1 / AC2 - On reload with persisted working state, saved order must be restored
  // (STS1 & STS2: "On page refresh, the updated order should persist.")
  it("restores persisted item order within a section on initial load", () => {
    const { result } = renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, mockWorkingState, false, mockSaveState)
    )

    const workSection = result.current.sections.find((s) => s.typeId === "work")!

    // Working state stored item-2 before item-1 - that reversed order must be honoured
    expect(workSection.items.map((i) => i.id)).toEqual(["item-2", "item-1"])
  })

  // Hydration from working state must not itself trigger a save
  // Prevents spurious dirty-state on first render (STS1: save only after an actual drag)
  it("does not call saveState during initial hydration from working state", () => {
    renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, mockWorkingState, false, mockSaveState)
    )

    expect(mockSaveState).not.toHaveBeenCalled()
  })

  // AC3 - Edge cases

  // AC3 - Item types with no matching canon items must be silently omitted
  it("omits sections that have no matching canon items", () => {
    const { result } = renderHook(() =>
      useResumeSections(
        mockItems,
        [makeItemType({ id: "empty", display_name: "Empty" })],
        null,
        false,
        mockSaveState
      )
    )

    expect(result.current.sections).toHaveLength(0)
  })

  // AC1 / AC2 - Save behaviour after reorder

  // AC1 & AC2 - After drag-and-drop, new order must be saved immediately (no debounce)
  // (STS1 & STS2: "new order should be auto-saved to the working state")
  it("calls saveState immediately when setSections is called after a reorder", () => {
    const { result } = renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, null, false, mockSaveState)
    )

    act(() => {
      // Simulate a drag completing - consumer calls setSections with the new order
      result.current.setSections([...result.current.sections])
    })

    expect(mockSaveState).toHaveBeenCalledTimes(1)
  })

  // AC1 - Every setSections call must trigger a save regardless of reference equality
  // Item order inside the same section may have changed even if the array ref looks the same
  it("calls saveState on every setSections call regardless of reference equality", () => {
    const { result } = renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, mockWorkingState, false, mockSaveState)
    )

    act(() => {
      result.current.setSections(result.current.sections)
    })

    expect(mockSaveState).toHaveBeenCalledTimes(1)
  })

  // AC2 - Item-level order validation

  // AC2 - Sections exposed by the hook must reflect new item positions after reorder
  // (STS2: "items should visually reorder immediately")
  it("reflects updated item order in sections after setSections is called", () => {
    const { result } = renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, null, false, mockSaveState)
    )

    const originalWorkSection = result.current.sections.find((s) => s.typeId === "work")!

    // Reverse item order to simulate drag from position 0 to position 1
    const reordered = originalWorkSection.items.slice().reverse()
    const updatedSections = result.current.sections.map((s) =>
      s.typeId === "work" ? { ...s, items: reordered } : s
    )

    act(() => {
      result.current.setSections(updatedSections)
    })

    const updatedWorkSection = result.current.sections.find((s) => s.typeId === "work")!

    // item-2 should now appear before item-1
    expect(updatedWorkSection.items.map((i) => i.id)).toEqual(["item-2", "item-1"])
  })

  // AC3 - Single-item section edge case

  // AC3 - A section with one item must render and accept setSections without throwing
  // (STS3: "single item - drag and drop should work properly")
  it("handles a single-item section without errors when setSections is called", () => {
    const singleItemEducation: CanonItem[] = [
      { id: "item-3", item_type_id: "education", position: 0, title: "School" } as CanonItem,
    ]

    const { result } = renderHook(() =>
      useResumeSections(
        singleItemEducation,
        [makeItemType({ id: "education", display_name: "Education" })],
        null,
        false,
        mockSaveState
      )
    )

    expect(result.current.sections).toHaveLength(1)
    expect(result.current.sections[0].items).toHaveLength(1)

    // Calling setSections on a single-item section must not throw
    expect(() => {
      act(() => {
        result.current.setSections([...result.current.sections])
      })
    }).not.toThrow()

    expect(mockSaveState).toHaveBeenCalledTimes(1)
  })
})