import { renderHook, act } from "@testing-library/react"
import { useResumeSections } from "@/lib/resume-builder/useResumeSections"
import type { CanonItem, ItemType } from "@/lib/types"

jest.useFakeTimers()


const makeItemType = (overrides?: Partial<ItemType>): ItemType => ({
  id: "work",
  display_name: "Work",
  user_id: "user_123",
  created_at: "2024-01-01",
  ...overrides,
})

const mockItemTypes: ItemType[] = [
  makeItemType({ id: "work", display_name: "Work" }),
  makeItemType({ id: "education", display_name: "Education" }),
]

const mockItems: CanonItem[] = [
  {
    id: "item-1",
    item_type_id: "work",
    position: 0,
    title: "Job A",
  } as CanonItem,
  {
    id: "item-2",
    item_type_id: "work",
    position: 1,
    title: "Job B",
  } as CanonItem,
  {
    id: "item-3",
    item_type_id: "education",
    position: 0,
    title: "School",
  } as CanonItem,
]

const mockWorkingState = {
  sections: [
    {
      item_type_id: "work",
      item_ids: ["item-2", "item-1"],
    },
    {
      item_type_id: "education",
      item_ids: ["item-3"],
    },
  ],
}


describe("useResumeSections", () => {
  const mockSaveState = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("uses computed sections when workingState is null", () => {
    const { result } = renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, null, false, mockSaveState)
    )

    expect(result.current.sections).toHaveLength(2)
    expect(result.current.sections[0].items).toHaveLength(2)
    expect(result.current.sections[1].items).toHaveLength(1)
  })

  it("filters out empty sections", () => {
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

  it("applies workingState ordering on initial load", () => {
    const { result } = renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, mockWorkingState, false, mockSaveState)
    )

    const workSection = result.current.sections.find((s) => s.typeId === "work")!

    expect(workSection.items.map((i) => i.id)).toEqual(["item-2", "item-1"])
  })

  it("does not call saveState on initial hydration", () => {
    renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, mockWorkingState, false, mockSaveState)
    )

    expect(mockSaveState).not.toHaveBeenCalled()
  })

  it("debounces save when sections change", () => {
    const { result } = renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, null, false, mockSaveState)
    )

    act(() => {
      result.current.setSections([...result.current.sections])
    })

    expect(mockSaveState).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(1000)
    })

    expect(mockSaveState).toHaveBeenCalledTimes(1)
  })

  it("does not save if serialized state is unchanged", () => {
    const { result } = renderHook(() =>
      useResumeSections(mockItems, mockItemTypes, mockWorkingState, false, mockSaveState)
    )
    act(() => {
      jest.advanceTimersByTime(1000)
    })
    act(() => {
      result.current.setSections(result.current.sections)
      jest.advanceTimersByTime(1000)
    })

    expect(mockSaveState).not.toHaveBeenCalled()
  })
})