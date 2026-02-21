/**
 * Tests for the override feature.
 * - EditOverrideModal: rendering, validation, save, reset
 * - Integration: edit button in DragItem, full edit flow
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditOverrideModal } from "@/lib/resume-builder/edit/EditOverrideModal"
import type { CanonItem, ItemType } from "@/lib/types"
import { act } from "react"

// Mock react-hot-toast
jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock lucide-react icons
jest.mock("lucide-react", () => ({
  Pencil: (props: any) => <svg data-testid="pencil-icon" {...props} />,
  ChevronLeft: (props: any) => <svg data-testid="chevron-left" {...props} />,
}))

// Mock Spinner
jest.mock("@/lib/components/Spinner", () => ({
  Spinner: ({ size }: { size?: number }) => <span data-testid="spinner">Loading...</span>,
}))

const mockItemTypes: ItemType[] = [
  { id: "type-work", user_id: "user_1", display_name: "Work Experience", created_at: "2024-01-01" },
  { id: "type-edu", user_id: "user_1", display_name: "Education", created_at: "2024-01-01" },
  { id: "type-skill", user_id: "user_1", display_name: "Skill", created_at: "2024-01-01" },
  { id: "type-project", user_id: "user_1", display_name: "Project", created_at: "2024-01-01" },
  { id: "type-link", user_id: "user_1", display_name: "Link", created_at: "2024-01-01" },
]

const makeWorkItem = (overrides?: Partial<CanonItem<unknown>>): CanonItem<unknown> => ({
  id: "item-1",
  user_id: "user_1",
  item_type_id: "type-work",
  title: "Software Engineer",
  position: 0,
  content: {
    org: "Google",
    role: "Software Engineer",
    start: "2023-01-01",
    end: "2024-01-01",
    bullets: ["Built features", "Shipped products"],
    skills: ["React", "TypeScript"],
  },
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
  ...overrides,
})

const makeSkillItem = (): CanonItem<unknown> => ({
  id: "item-skill",
  user_id: "user_1",
  item_type_id: "type-skill",
  title: "Languages",
  position: 0,
  content: {
    category: "Languages",
    skills: ["JavaScript", "Python"],
  },
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
})

const makeEducationItem = (): CanonItem<unknown> => ({
  id: "item-edu",
  user_id: "user_1",
  item_type_id: "type-edu",
  title: "UC Santa Cruz",
  position: 0,
  content: {
    institution: "UC Santa Cruz",
    degree: "Bachelor of Science",
    field: "Computer Science",
    start: "2020-09-01",
    end: "2024-06-15",
    gpa: "3.8",
    bullets: ["Dean's List", "Honors"],
  },
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
})

const makeProjectItem = (): CanonItem<unknown> => ({
  id: "item-project",
  user_id: "user_1",
  item_type_id: "type-project",
  title: "Vitae",
  position: 0,
  content: {
    title: "Vitae",
    description: "Resume builder app",
    url: "https://github.com/vitae",
    start: "2024-01-01",
    end: "2024-06-01",
    bullets: ["Built with Next.js", "Typst PDF rendering"],
    skills: ["React", "Next.js", "TypeScript"],
  },
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
})

const makeLinkItem = (): CanonItem<unknown> => ({
  id: "item-link",
  user_id: "user_1",
  item_type_id: "type-link",
  title: "GitHub",
  position: 0,
  content: {
    label: "GitHub",
    url: "https://github.com/johndoe",
  },
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
})

describe("EditOverrideModal", () => {
  const mockSave = jest.fn().mockResolvedValue(undefined)
  const mockReset = jest.fn().mockResolvedValue(undefined)
  const mockClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("renders with correct title and item type", () => {
    const item = makeWorkItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    expect(screen.getByText("Edit for This Resume")).toBeInTheDocument()
    expect(screen.getByText("Work Experience")).toBeInTheDocument()
    expect(screen.getByText("Changes only affect this resume, not the original item.")).toBeInTheDocument()
  })

  it("pre-fills form with existing item content", () => {
    const item = makeWorkItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    // Check that existing values are pre-filled
    const companyInput = screen.getByDisplayValue("Google")
    expect(companyInput).toBeInTheDocument()

    const roleInput = screen.getByDisplayValue("Software Engineer")
    expect(roleInput).toBeInTheDocument()
  })

  it("pre-fills form with existing override applied on top of content", () => {
    const item = makeWorkItem()
    const override = { content: { org: "Meta", role: "Senior Engineer" } }
    render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        override={override}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    // Should show override values, not original
    expect(screen.getByDisplayValue("Meta")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Senior Engineer")).toBeInTheDocument()
  })

  it("shows Reset to Original button only when override exists", () => {
    const item = makeWorkItem()

    // Without override
    const { unmount } = render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )
    expect(screen.queryByText("Reset to Original")).not.toBeInTheDocument()
    unmount()

    // With override
    render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        override={{ content: { org: "Meta" } }}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )
    expect(screen.getByText("Reset to Original")).toBeInTheDocument()
  })

  it("calls onClose when Cancel button is clicked", async () => {
    const item = makeWorkItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Cancel"))
    expect(mockClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when clicking the overlay", async () => {
    const item = makeWorkItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    // Click the overlay (first element with modal-overlay class)
    const overlay = document.querySelector(".modal-overlay") as HTMLElement
    await userEvent.click(overlay)
    expect(mockClose).toHaveBeenCalled()
  })

  it("validates required fields before saving", async () => {
    const item = makeWorkItem({ content: { org: "", role: "", start: "", bullets: [], skills: [] } })
    render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Save Override"))

    // Should show validation error, not call onSave
    await waitFor(() => {
      const errorEl = document.querySelector("[style*='color: rgb(185, 28, 28)']") as HTMLElement
      expect(errorEl).toBeTruthy()
    })
    expect(mockSave).not.toHaveBeenCalled()
  })

  it("calls onSave with correct data on valid submission", async () => {
    const item = makeWorkItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Save Override"))

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    const [itemId, override] = mockSave.mock.calls[0]
    expect(itemId).toBe("item-1")
    expect(override.content).toBeDefined()
    expect(override.content.org).toBe("Google")
    expect(override.content.role).toBe("Software Engineer")
  })

  it("calls onReset when Reset to Original is clicked", async () => {
    const item = makeWorkItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        override={{ content: { org: "Meta" } }}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Reset to Original"))

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith("item-1")
    })
  })

  it("renders correct form fields for Skill type", () => {
    const item = makeSkillItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Skill"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    // Skill form should show category and skills fields
    expect(screen.getByDisplayValue("Languages")).toBeInTheDocument()
    expect(screen.getByDisplayValue("JavaScript, Python")).toBeInTheDocument()
  })

  it("renders correct form fields for Education type", () => {
    const item = makeEducationItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Education"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    expect(screen.getByDisplayValue("UC Santa Cruz")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Bachelor of Science")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Computer Science")).toBeInTheDocument()
    expect(screen.getByDisplayValue("3.8")).toBeInTheDocument()
  })

  it("renders correct form fields for Project type", () => {
    const item = makeProjectItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Project"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    expect(screen.getByDisplayValue("Vitae")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Resume builder app")).toBeInTheDocument()
    expect(screen.getByDisplayValue("https://github.com/vitae")).toBeInTheDocument()
  })

  it("renders correct form fields for Link type", () => {
    const item = makeLinkItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Link"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    expect(screen.getByDisplayValue("GitHub")).toBeInTheDocument()
    expect(screen.getByDisplayValue("https://github.com/johndoe")).toBeInTheDocument()
  })

  it("validates and saves Education override correctly", async () => {
    const item = makeEducationItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Education"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Save Override"))

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    const [itemId, override] = mockSave.mock.calls[0]
    expect(itemId).toBe("item-edu")
    expect(override.content.institution).toBe("UC Santa Cruz")
    expect(override.content.degree).toBe("Bachelor of Science")
  })

  it("validates and saves Project override correctly", async () => {
    const item = makeProjectItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Project"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Save Override"))

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    const [itemId, override] = mockSave.mock.calls[0]
    expect(itemId).toBe("item-project")
    expect(override.content.title).toBe("Vitae")
    expect(override.content.description).toBe("Resume builder app")
    expect(override.content.skills).toEqual(["React", "Next.js", "TypeScript"])
  })

  it("validates and saves Link override correctly", async () => {
    const item = makeLinkItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Link"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Save Override"))

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    const [itemId, override] = mockSave.mock.calls[0]
    expect(itemId).toBe("item-link")
    expect(override.content.label).toBe("GitHub")
    expect(override.content.url).toBe("https://github.com/johndoe")
  })

  it("validates and saves Skill override correctly", async () => {
    const item = makeSkillItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Skill"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Save Override"))

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1)
    })

    const [itemId, override] = mockSave.mock.calls[0]
    expect(itemId).toBe("item-skill")
    expect(override.content.category).toBe("Languages")
    expect(override.content.skills).toEqual(["JavaScript", "Python"])
  })

  it("shows validation errors for empty Education required fields", async () => {
    const item = makeEducationItem()
    // Override with empty institution (required field)
    ;(item.content as any).institution = ""
    render(
      <EditOverrideModal
        item={item}
        typeName="Education"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Save Override"))

    await waitFor(() => {
      const errorEl = document.querySelector("[style*='color: rgb(185, 28, 28)']") as HTMLElement
      expect(errorEl).toBeTruthy()
    })
    expect(mockSave).not.toHaveBeenCalled()
  })

  it("shows validation errors for empty Link required fields", async () => {
    const item = makeLinkItem()
    ;(item.content as any).label = ""
    ;(item.content as any).url = ""
    render(
      <EditOverrideModal
        item={item}
        typeName="Link"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Save Override"))

    await waitFor(() => {
      const errorEl = document.querySelector("[style*='color: rgb(185, 28, 28)']") as HTMLElement
      expect(errorEl).toBeTruthy()
    })
    expect(mockSave).not.toHaveBeenCalled()
  })

  it("shows validation errors for empty Skill required fields", async () => {
    const item = makeSkillItem()
    ;(item.content as any).category = ""
    ;(item.content as any).skills = []
    render(
      <EditOverrideModal
        item={item}
        typeName="Skill"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Save Override"))

    await waitFor(() => {
      const errorEl = document.querySelector("[style*='color: rgb(185, 28, 28)']") as HTMLElement
      expect(errorEl).toBeTruthy()
    })
    expect(mockSave).not.toHaveBeenCalled()
  })

  it("shows validation errors for empty Project required fields", async () => {
    const item = makeProjectItem()
    ;(item.content as any).title = ""
    render(
      <EditOverrideModal
        item={item}
        typeName="Project"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
      />
    )

    await userEvent.click(screen.getByText("Save Override"))

    await waitFor(() => {
      const errorEl = document.querySelector("[style*='color: rgb(185, 28, 28)']") as HTMLElement
      expect(errorEl).toBeTruthy()
    })
    expect(mockSave).not.toHaveBeenCalled()
  })

  it("shows saving state with spinner", () => {
    const item = makeWorkItem()
    render(
      <EditOverrideModal
        item={item}
        typeName="Work Experience"
        itemTypes={mockItemTypes}
        onSave={mockSave}
        onReset={mockReset}
        onClose={mockClose}
        saving={true}
      />
    )

    expect(screen.getByText("Saving...")).toBeInTheDocument()
    expect(screen.getByTestId("spinner")).toBeInTheDocument()
  })
})

// ── Integration tests ──────────────────────────────────────────

describe("Override Integration Flow", () => {
  const mockFetch = jest.fn()
  global.fetch = mockFetch as unknown as typeof fetch

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "log").mockImplementation(() => {})
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  it("renders edit buttons for each DragItem", async () => {
    // We test by importing DragItem directly
    const { DragItem } = require("@/lib/resume-builder/DragItem")

    const item = makeWorkItem()
    const mockFn = jest.fn()

    render(
      <DragItem
        item={item}
        section={{ typeName: "Work Experience", typeId: "type-work", items: [item] }}
        sectionIndex={0}
        itemIndex={0}
        sections={[]}
        setSections={mockFn}
        draggedItem={null}
        setDraggedItem={mockFn}
        saveItemPosition={mockFn}
        formatDate={(d: string) => d}
        handleItemDragEnd={mockFn}
        isSelected={() => false}
        toggleItem={mockFn}
        onEditOverride={mockFn}
        hasOverride={false}
      />
    )

    const editButton = screen.getByLabelText("Edit item for this resume")
    expect(editButton).toBeInTheDocument()
    expect(editButton).toHaveAttribute("title", "Edit for this resume")
  })

  it("shows override indicator dot when item has override", async () => {
    const { DragItem } = require("@/lib/resume-builder/DragItem")

    const item = makeWorkItem()
    const mockFn = jest.fn()

    render(
      <DragItem
        item={item}
        section={{ typeName: "Work Experience", typeId: "type-work", items: [item] }}
        sectionIndex={0}
        itemIndex={0}
        sections={[]}
        setSections={mockFn}
        draggedItem={null}
        setDraggedItem={mockFn}
        saveItemPosition={mockFn}
        formatDate={(d: string) => d}
        handleItemDragEnd={mockFn}
        isSelected={() => false}
        toggleItem={mockFn}
        onEditOverride={mockFn}
        hasOverride={true}
      />
    )

    const editButton = screen.getByLabelText("Edit item for this resume")
    expect(editButton).toHaveAttribute("title", "Edited for this resume (click to modify)")
    // The blue dot indicator should exist
    const dot = editButton.querySelector("span")
    expect(dot).toBeTruthy()
  })

  it("calls onEditOverride when edit button is clicked", async () => {
    const { DragItem } = require("@/lib/resume-builder/DragItem")

    const item = makeWorkItem()
    const onEditOverride = jest.fn()
    const mockFn = jest.fn()

    render(
      <DragItem
        item={item}
        section={{ typeName: "Work Experience", typeId: "type-work", items: [item] }}
        sectionIndex={0}
        itemIndex={0}
        sections={[]}
        setSections={mockFn}
        draggedItem={null}
        setDraggedItem={mockFn}
        saveItemPosition={mockFn}
        formatDate={(d: string) => d}
        handleItemDragEnd={mockFn}
        isSelected={() => false}
        toggleItem={mockFn}
        onEditOverride={onEditOverride}
        hasOverride={false}
      />
    )

    const editButton = screen.getByLabelText("Edit item for this resume")
    await userEvent.click(editButton)

    expect(onEditOverride).toHaveBeenCalledWith(item)
  })

  it("full override save flow: edit → submit → verify API call includes overrides", async () => {
    // This tests the useWorkingState hook's saveOverride function
    const { useWorkingState } = require("@/lib/working-state/useWorkingState")
    const { renderHook, act: actHook } = require("@testing-library/react")

    // Mock initial fetch (GET working state)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        state: {
          sections: [{ item_type_id: "type-work", item_ids: ["item-1"] }],
        },
        updated_at: "2026-02-20T00:00:00Z",
      }),
    })

    const { result } = renderHook(() => useWorkingState())

    // Wait for loading to finish
    await actHook(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(result.current.loading).toBe(false)

    // Mock the PUT response for saveOverride
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        state: {
          sections: [{ item_type_id: "type-work", item_ids: ["item-1"] }],
          overrides: { "item-1": { title: "Senior Engineer", content: { org: "Meta", role: "Senior Engineer" } } },
        },
        updated_at: "2026-02-20T00:01:00Z",
      }),
    })

    // Call saveOverride
    await actHook(async () => {
      await result.current.saveOverride("item-1", {
        title: "Senior Engineer",
        content: { org: "Meta", role: "Senior Engineer" },
      })
    })

    // Verify PUT was called with overrides
    const putCall = mockFetch.mock.calls.find((call: any) => call[1]?.method === "PUT")
    expect(putCall).toBeDefined()
    const body = JSON.parse(putCall[1].body)
    expect(body.overrides).toBeDefined()
    expect(body.overrides["item-1"].content.org).toBe("Meta")

    // Verify getOverride returns the override
    expect(result.current.getOverride("item-1")).toEqual({
      title: "Senior Engineer",
      content: { org: "Meta", role: "Senior Engineer" },
    })
  })

  it("clearOverride removes an existing override", async () => {
    const { useWorkingState } = require("@/lib/working-state/useWorkingState")
    const { renderHook, act: actHook } = require("@testing-library/react")

    // Mock initial fetch with an override already in state
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        state: {
          sections: [{ item_type_id: "type-work", item_ids: ["item-1"] }],
          overrides: { "item-1": { content: { org: "Meta" } } },
        },
        updated_at: "2026-02-20T00:00:00Z",
      }),
    })

    const { result } = renderHook(() => useWorkingState())

    await actHook(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })

    expect(result.current.getOverride("item-1")).toBeDefined()

    // Mock the PUT response for clearOverride
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        state: {
          sections: [{ item_type_id: "type-work", item_ids: ["item-1"] }],
        },
        updated_at: "2026-02-20T00:02:00Z",
      }),
    })

    await actHook(async () => {
      await result.current.clearOverride("item-1")
    })

    // Verify override is cleared
    expect(result.current.getOverride("item-1")).toBeUndefined()

    // Verify PUT was called without overrides (or with empty overrides)
    const putCalls = mockFetch.mock.calls.filter((call: any) => call[1]?.method === "PUT")
    const lastPut = putCalls[putCalls.length - 1]
    const body = JSON.parse(lastPut[1].body)
    expect(body.overrides).toBeUndefined()
  })
})
