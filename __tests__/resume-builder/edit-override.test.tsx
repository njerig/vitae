import { useState } from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { EditOverrideModal } from "@/lib/resume-builder/components/edit/EditOverrideModal"
import { DragItem } from "@/lib/resume-builder/components/drag/DragItem"
import type { CanonItem, ItemType } from "@/lib/shared/types"

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const DEFAULT_ITEM_TYPES: ItemType[] = [
  { id: "1", user_id: "user_1", display_name: "Work Experience", created_at: "" },
  { id: "2", user_id: "user_1", display_name: "Education", created_at: "" },
  { id: "3", user_id: "user_1", display_name: "Project", created_at: "" },
  { id: "4", user_id: "user_1", display_name: "Skill", created_at: "" },
  { id: "5", user_id: "user_1", display_name: "Link", created_at: "" },
]
const TYPE_ID_BY_NAME = Object.fromEntries(DEFAULT_ITEM_TYPES.map((t) => [t.display_name, t.id]))

// create the base items to render on the builder
const serverItems: CanonItem<unknown>[] = [
  {
    id: "item-work",
    user_id: "user_123",
    item_type_id: TYPE_ID_BY_NAME["Work Experience"],
    title: "Developer",
    position: 0,
    content: { role: "Developer", org: "Old Corp" },
    created_at: "",
    updated_at: "",
  },
  {
    id: "item-edu",
    user_id: "user_123",
    item_type_id: TYPE_ID_BY_NAME["Education"],
    title: "Initial Edu",
    position: 1,
    content: { institution: "Initial Edu" },
    created_at: "",
    updated_at: "",
  },
  {
    id: "item-proj",
    user_id: "user_123",
    item_type_id: TYPE_ID_BY_NAME["Project"],
    title: "Initial Proj",
    position: 2,
    content: { title: "Initial Proj" },
    created_at: "",
    updated_at: "",
  },
  {
    id: "item-skill",
    user_id: "user_123",
    item_type_id: TYPE_ID_BY_NAME["Skill"],
    title: "Initial Skill",
    position: 3,
    content: { category: "Initial Skill" },
    created_at: "",
    updated_at: "",
  },
  {
    id: "item-link",
    user_id: "user_123",
    item_type_id: TYPE_ID_BY_NAME["Link"],
    title: "Initial Link",
    position: 4,
    content: { label: "Initial Link" },
    created_at: "",
    updated_at: "",
  },
]

// a component that renders the builder, which consists of the drag items and allows us to easily mock editing them
function BuilderComponent() {
  const [editingItem, setEditingItem] = useState<CanonItem<unknown> | null>(null)
  const [overrides, setOverrides] = useState<Record<string, any>>({})

  // Map each item to its own section for DragItem
  const sections = serverItems.map((item) => ({
    typeId: item.item_type_id,
    typeName: DEFAULT_ITEM_TYPES.find((t) => t.id === item.item_type_id)?.display_name,
    items: [item],
  }))

  return (
    <div>
      {sections.map((section, idx) => (
        <DragItem
          key={section.items[0].id}
          item={section.items[0]}
          section={section}
          sectionIndex={idx}
          itemIndex={0}
          sections={sections}
          setSections={() => {}}
          draggedItem={null}
          setDraggedItem={() => {}}
          formatDate={(d: string) => d}
          handleItemDragEnd={() => {}}
          isSelected={() => true}
          toggleItem={() => {}}
          onEditOverride={setEditingItem}
          hasOverride={!!overrides[section.items[0].id]}
        />
      ))}

      {editingItem && (
        <EditOverrideModal
          item={editingItem}
          typeName={DEFAULT_ITEM_TYPES.find((t) => t.id === editingItem.item_type_id)?.display_name!}
          override={overrides[editingItem.id]}
          onSave={async (id, override) => {
            setOverrides((prev) => ({ ...prev, [id]: override }))
            setEditingItem(null)
          }}
          onReset={async (id) => {
            setOverrides((prev) => {
              const next = { ...prev }
              delete next[id]
              return next
            })
            setEditingItem(null)
          }}
          onClose={() => setEditingItem(null)}
          saving={false}
        />
      )}
    </div>
  )
}

// helper function to find the actual input that gets placed next to a given text label
function getFieldControl(labelPattern: string | RegExp) {
  const label = screen.getByText(labelPattern, { selector: "label" })
  const control = label.parentElement?.querySelector("input, textarea, select")
  if (!control) throw new Error(`No form control found for ${labelPattern}`)
  return control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
}

describe("Override interaction flow", () => {
  it("can override one of each item type", async () => {
    render(<BuilderComponent />)

    // Wait for the DragItems to render
    await waitFor(() => {
      expect(screen.getByText("Developer")).toBeInTheDocument()
    })

    const typeCases = [
      {
        initialTitle: "Developer",
        fill: () => {
          fireEvent.change(getFieldControl(/position/i), { target: { value: "Lead Eng" } })
          fireEvent.change(getFieldControl(/company/i), { target: { value: "New Corp" } })
          fireEvent.change(getFieldControl(/location/i), { target: { value: "SF" } })
          fireEvent.change(getFieldControl(/start date/i), { target: { value: "2024-01-01" } })
          fireEvent.change(getFieldControl(/bullet points/i), { target: { value: "Did stuff" } })
        },
      },
      {
        initialTitle: "Initial Edu",
        fill: () => {
          fireEvent.change(getFieldControl(/institution/i), { target: { value: "Stanford" } })
          fireEvent.change(getFieldControl(/location/i), { target: { value: "CA" } })
          fireEvent.change(getFieldControl(/start date/i), { target: { value: "2020-01-01" } })
        },
      },
      {
        initialTitle: "Initial Proj",
        fill: () => {
          fireEvent.change(getFieldControl(/project name/i), { target: { value: "Super App" } })
          fireEvent.change(getFieldControl(/start date/i), { target: { value: "2024-01-01" } })
          fireEvent.change(getFieldControl(/bullet points/i), { target: { value: "Built app" } })
        },
      },
      {
        initialTitle: "Initial Skill",
        fill: () => {
          fireEvent.change(getFieldControl(/category/i), { target: { value: "Tools" } })
          fireEvent.change(getFieldControl(/skills/i), { target: { value: "Git, Docker" } })
        },
      },
      {
        initialTitle: "Initial Link",
        fill: () => {
          fireEvent.change(getFieldControl(/label/i), { target: { value: "LinkedIn" } })
          fireEvent.change(getFieldControl(/^url/i), { target: { value: "linkedin.com/user" } })
        },
      },
    ]

    for (const typeCase of typeCases) {
      // Find the DragItem listing in the UI
      const titleEl = screen.getByText(typeCase.initialTitle)
      const container = titleEl.closest(".group")
      if (!container) throw new Error(`Could not find DragItem container for "${typeCase.initialTitle}"`)

      // Inside DragItem, find the pencil edit button
      const editButton = container.querySelector('button[aria-label="Edit item for this resume"]')
      if (!editButton) throw new Error(`No override edit button for "${typeCase.initialTitle}"`)

      // Click the edit pencil
      fireEvent.click(editButton)

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Save Override" })).toBeInTheDocument()
      })

      // Update fields
      typeCase.fill()

      // Submit
      fireEvent.click(screen.getByRole("button", { name: "Save Override" }))

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByText("Edit for This Resume")).not.toBeInTheDocument()
      })
      
      // Since DragItem doesn't re-render visual text when overridden (only displays it in PDF preview),
      // we know the override was saved functionally because the Pencil button title turns into
      // "Edited for this resume (click to modify)" 
      const editButtonModified = container.querySelector('button[aria-label="Edit item for this resume"]')
      expect(editButtonModified).toHaveAttribute("title", "Edited for this resume (click to modify)")
    }
  })
})
