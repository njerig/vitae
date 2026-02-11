import { render, screen, waitFor, within } from "@testing-library/react"
import { act } from "@testing-library/react"
import ResumeClient from "@/app/resume/resume-client"
import { useWorkingState } from "@/lib/working-state/useWorkingState"
import { useCanon } from "@/lib/canon/useCanon"
import type { CanonItem, ItemType } from "@/lib/types"

jest.mock("@/lib/working-state/useWorkingState")
jest.mock("@/lib/canon/useCanon")
jest.mock("next/link", () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>
})

jest.mock("@/app/resume/ResumePreview", () => ({
  ResumePreview: ({ sections, profile }: any) => (
    <div data-testid="resume-preview">
      <div>Preview for {profile.name}</div>
      <div>{sections.length} sections</div>
    </div>
  )
}))

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock

jest.useFakeTimers()

const makeItemType = (overrides?: Partial<ItemType>): ItemType => ({
  id: "work",
  display_name: "Work",
  user_id: "user_123",
  created_at: "2024-01-01",
  ...overrides,
})

const mockItemTypes: ItemType[] = [
  makeItemType({ id: "work", display_name: "Work Experience" }),
  makeItemType({ id: "education", display_name: "Education" }),
  makeItemType({ id: "project", display_name: "Project" }),
]

const mockItems: CanonItem[] = [
  {
    id: "item-1",
    item_type_id: "work",
    position: 0,
    title: "Senior Developer",
    content: { role: "Senior Developer", org: "Company A" },
    user_id: "user_123",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  } as CanonItem,
  {
    id: "item-2",
    item_type_id: "work",
    position: 1,
    title: "Junior Developer",
    content: { role: "Junior Developer", org: "Company B" },
    user_id: "user_123",
    created_at: "2024-01-02",
    updated_at: "2024-01-02",
  } as CanonItem,
  {
    id: "item-3",
    item_type_id: "education",
    position: 0,
    title: "University",
    content: { institution: "State University", degree: "BS Computer Science" },
    user_id: "user_123",
    created_at: "2024-01-03",
    updated_at: "2024-01-03",
  } as CanonItem,
  {
    id: "item-4",
    item_type_id: "project",
    position: 0,
    title: "Portfolio Website",
    content: { title: "Portfolio Website", description: "Built with React" },
    user_id: "user_123",
    created_at: "2024-01-04",
    updated_at: "2024-01-04",
  } as CanonItem,
]

describe("Resume Builder - Reorder Persistence Integration", () => {
  const mockSaveState = jest.fn()
  const mockPatch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    
    ;(useCanon as jest.Mock).mockReturnValue({
      allItems: mockItems,
      itemTypes: mockItemTypes,
      loading: false,
      patch: mockPatch,
    })
    
    ;(useWorkingState as jest.Mock).mockReturnValue({
      state: null,
      loading: false,
      saving: false,
      saveState: mockSaveState,
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
  })

  describe("Initial Load", () => {
    it("loads sections in default order when no working state exists", () => {
      render(<ResumeClient userName="Test User" userId="user_123" />)

      const sectionHeaders = screen.getAllByRole("heading", { level: 3 })
      
      expect(sectionHeaders[0]).toHaveTextContent("Work Experience")
      expect(sectionHeaders[1]).toHaveTextContent("Education")
      expect(sectionHeaders[2]).toHaveTextContent("Project")
    })

    it("loads sections in persisted order when working state exists", () => {
      const savedWorkingState = {
        sections: [
          { item_type_id: "project", item_ids: ["item-4"] },
          { item_type_id: "work", item_ids: ["item-1", "item-2"] },
          { item_type_id: "education", item_ids: ["item-3"] },
        ],
      }

      ;(useWorkingState as jest.Mock).mockReturnValue({
        state: savedWorkingState,
        loading: false,
        saving: false,
        saveState: mockSaveState,
      })

      render(<ResumeClient userName="Test User" userId="user_123" />)

      const sectionHeaders = screen.getAllByRole("heading", { level: 3 })
      
      expect(sectionHeaders[0]).toHaveTextContent("Project")
      expect(sectionHeaders[1]).toHaveTextContent("Work Experience")
      expect(sectionHeaders[2]).toHaveTextContent("Education")
    })

    it("loads items in persisted order within sections", () => {
      const savedWorkingState = {
        sections: [
          { item_type_id: "work", item_ids: ["item-2", "item-1"] },
          { item_type_id: "education", item_ids: ["item-3"] },
          { item_type_id: "project", item_ids: ["item-4"] },
        ],
      }

      ;(useWorkingState as jest.Mock).mockReturnValue({
        state: savedWorkingState,
        loading: false,
        saving: false,
        saveState: mockSaveState,
      })

      render(<ResumeClient userName="Test User" userId="user_123" />)

      const workSection = screen.getByText("Work Experience").closest("div[draggable='true']") as HTMLElement
      expect(workSection).toBeInTheDocument()

      const items = within(workSection).getAllByText(/Developer/)
      
      expect(items[0]).toHaveTextContent("Junior Developer")
      expect(items[1]).toHaveTextContent("Senior Developer")
    })

    it("does not trigger save on initial load", () => {
      render(<ResumeClient userName="Test User" userId="user_123" />)

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockSaveState).not.toHaveBeenCalled()
    })
  })

  describe("Section Reordering", () => {
    it("saves section order when position input is changed", async () => {
      render(<ResumeClient userName="Test User" userId="user_123" />)

      const sectionOrderLabels = screen.getAllByText("Section order:")
      const firstLabel = sectionOrderLabels[0]
      const container = firstLabel.parentElement!
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      
      act(() => {
        input.focus()
        input.value = "2"
        input.blur()
      })

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockSaveState).toHaveBeenCalled()
      })
    })
  })

  describe("Item Reordering", () => {
    it("persists item reorder within section after debounce", async () => {
      render(<ResumeClient userName="Test User" userId="user_123" />)

      const hashLabels = screen.getAllByText("#")
      const firstLabel = hashLabels[0]
      const container = firstLabel.parentElement!
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      
      act(() => {
        input.focus()
        input.value = "2"
        input.blur()
      })

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockSaveState).toHaveBeenCalled()
      })
    })

    it("calls patch to save item position to database", async () => {
      render(<ResumeClient userName="Test User" userId="user_123" />)

      const hashLabels = screen.getAllByText("#")
      const firstLabel = hashLabels[0]
      const container = firstLabel.parentElement!
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      
      act(() => {
        input.focus()
        input.value = "2"
        input.blur()
      })

      await waitFor(() => {
        expect(mockPatch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ position: expect.any(Number) })
        )
      })
    })
  })

  describe("Debouncing", () => {
    it("debounces multiple rapid changes", async () => {
      render(<ResumeClient userName="Test User" userId="user_123" />)

      const sectionOrderLabels = screen.getAllByText("Section order:")
      const firstLabel = sectionOrderLabels[0]
      const container = firstLabel.parentElement!
      const input = container.querySelector('input[type="text"]') as HTMLInputElement

      act(() => {
        input.focus()
        input.value = "2"
        input.blur()
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })

      act(() => {
        input.focus()
        input.value = "3"
        input.blur()
      })

      expect(mockSaveState).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockSaveState).toHaveBeenCalled()
      })
      
      expect(mockSaveState).toHaveBeenCalledTimes(1)
    })

    it("does not save if order hasn't actually changed", async () => {
      const savedWorkingState = {
        sections: [
          { item_type_id: "work", item_ids: ["item-1", "item-2"] },
          { item_type_id: "education", item_ids: ["item-3"] },
          { item_type_id: "project", item_ids: ["item-4"] },
        ],
      }

      ;(useWorkingState as jest.Mock).mockReturnValue({
        state: savedWorkingState,
        loading: false,
        saving: false,
        saveState: mockSaveState,
      })

      render(<ResumeClient userName="Test User" userId="user_123" />)

      act(() => {
        jest.advanceTimersByTime(2000)
      })

      expect(mockSaveState).not.toHaveBeenCalled()
    })
  })

  describe("Loading States", () => {
    it("shows loading state while fetching data", () => {
      ;(useCanon as jest.Mock).mockReturnValue({
        allItems: [],
        itemTypes: [],
        loading: true,
        patch: mockPatch,
      })

      render(<ResumeClient userName="Test User" userId="user_123" />)

      expect(screen.getByText(/Loading your resume/i)).toBeInTheDocument()
    })

    it("shows saving indicator when working state is saving", () => {
      ;(useWorkingState as jest.Mock).mockReturnValue({
        state: null,
        loading: false,
        saving: true,
        saveState: mockSaveState,
      })

      render(<ResumeClient userName="Test User" userId="user_123" />)

      expect(screen.getAllByText(/Auto-saving/i).length).toBeGreaterThan(0)
    })
  })

  describe("Edge Cases", () => {
    it("handles empty sections gracefully", () => {
      ;(useCanon as jest.Mock).mockReturnValue({
        allItems: [],
        itemTypes: mockItemTypes,
        loading: false,
        patch: mockPatch,
      })

      render(<ResumeClient userName="Test User" userId="user_123" />)

      expect(screen.getByText(/No items yet/i)).toBeInTheDocument()
    })

    it("filters out sections with no items", () => {
      const workItemsOnly: CanonItem[] = [mockItems[0], mockItems[1]]

      ;(useCanon as jest.Mock).mockReturnValue({
        allItems: workItemsOnly,
        itemTypes: mockItemTypes,
        loading: false,
        patch: mockPatch,
      })

      render(<ResumeClient userName="Test User" userId="user_123" />)

      const sectionHeaders = screen.getAllByRole("heading", { level: 3 })
      const resumeSections = sectionHeaders.filter(h => 
        !h.textContent?.includes("Resume Preview") && 
        !h.textContent?.includes("Resume Builder")
      )
      
      expect(resumeSections).toHaveLength(1)
      expect(resumeSections[0]).toHaveTextContent("Work Experience")
    })

    it("handles single item sections", () => {
      const singleItemPerSection: CanonItem[] = [
        mockItems[0],
        mockItems[2],
        mockItems[3],
      ]

      ;(useCanon as jest.Mock).mockReturnValue({
        allItems: singleItemPerSection,
        itemTypes: mockItemTypes,
        loading: false,
        patch: mockPatch,
      })

      render(<ResumeClient userName="Test User" userId="user_123" />)

      expect(screen.getAllByText("1 item").length).toBe(3)
    })
  })

  describe("Full Round-Trip Persistence", () => {
    it("simulates full persistence cycle: reorder → save → reload → verify", async () => {
      const { unmount } = render(<ResumeClient userName="Test User" userId="user_123" />)

      let sectionHeaders = screen.getAllByRole("heading", { level: 3 })
      const resumeSections = sectionHeaders.filter(h => 
        !h.textContent?.includes("Resume Preview") && 
        !h.textContent?.includes("Resume Builder")
      )
      
      expect(resumeSections[0]).toHaveTextContent("Work Experience")

      const sectionOrderLabels = screen.getAllByText("Section order:")
      const firstLabel = sectionOrderLabels[0]
      const container = firstLabel.parentElement!
      const input = container.querySelector('input[type="text"]') as HTMLInputElement
      
      act(() => {
        input.focus()
        input.value = "3"
        input.blur()
      })

      await act(async () => {
        jest.advanceTimersByTime(1000)
      })

      await waitFor(() => {
        expect(mockSaveState).toHaveBeenCalled()
      })

      const savedState = mockSaveState.mock.calls[0][0]

      unmount()

      ;(useWorkingState as jest.Mock).mockReturnValue({
        state: savedState,
        loading: false,
        saving: false,
        saveState: mockSaveState,
      })

      render(<ResumeClient userName="Test User" userId="user_123" />)

      sectionHeaders = screen.getAllByRole("heading", { level: 3 })
      const reloadedSections = sectionHeaders.filter(h => 
        !h.textContent?.includes("Resume Preview") && 
        !h.textContent?.includes("Resume Builder")
      )

      expect(reloadedSections[2]).toHaveTextContent("Work Experience")
    })
  })
})