import { useState } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { CanonForm } from "@/lib/canon/components/CanonForm"
import { CanonList } from "@/lib/canon/components/CanonList"
import { useCanon } from "@/lib/canon/useCanon"
import type { CanonItem, ItemType } from "@/lib/shared/types"
import * as canonApi from "@/lib/canon/api"

// mock the api calls, meaning that we don't need to make actual api calls to test the components
// basically we make a stub that mocks api calls
jest.mock("@/lib/canon/api", () => {
  const actual = jest.requireActual("@/lib/canon/api")
  return {
    ...actual,
    listItemTypes: jest.fn(),
    listCanonItems: jest.fn(),
    createCanonItem: jest.fn(),
    patchCanonItem: jest.fn(),
    deleteCanonItem: jest.fn(),
  }
})

// Create different item types that we will test with
const DEFAULT_ITEM_TYPES: ItemType[] = [
  { id: "1", user_id: "user_123", display_name: "Work Experience", created_at: "2026-01-01T00:00:00.000Z" },
  { id: "2", user_id: "user_123", display_name: "Education", created_at: "2026-01-01T00:00:00.000Z" },
  { id: "3", user_id: "user_123", display_name: "Project", created_at: "2026-01-01T00:00:00.000Z" },
  { id: "4", user_id: "user_123", display_name: "Skill", created_at: "2026-01-01T00:00:00.000Z" },
  { id: "5", user_id: "user_123", display_name: "Link", created_at: "2026-01-01T00:00:00.000Z" },
]

// make a map of item type names to their ids for easy access
const TYPE_ID_BY_NAME = Object.fromEntries(DEFAULT_ITEM_TYPES.map((type) => [type.display_name, type.id]))

// cast functions to avoid typescript errors
const mockedListItemTypes = canonApi.listItemTypes as jest.MockedFunction<typeof canonApi.listItemTypes>
const mockedListCanonItems = canonApi.listCanonItems as jest.MockedFunction<typeof canonApi.listCanonItems>
const mockedPatchCanonItem = canonApi.patchCanonItem as jest.MockedFunction<typeof canonApi.patchCanonItem>

// a component that allows us to easily access the form and list together for testing
function CanonComponent() {
  const { items, itemTypes, patch, saving, error } = useCanon()
  const [editingItem, setEditingItem] = useState<CanonItem<unknown> | null>(null)

  return (
    <div>
      {editingItem && (
        <CanonForm
          itemTypes={itemTypes}
          editing={editingItem}
          onCancel={() => setEditingItem(null)}
          onSubmit={async (payload) => {
            await patch(editingItem.id, payload)
            setEditingItem(null)
          }}
          saving={saving}
          error={error}
        />
      )}
      <CanonList
        items={items}
        itemTypes={itemTypes}
        onEdit={(item) => setEditingItem(item)}
        onDelete={() => {}}
      />
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

describe("Canon interaction editing items flow", () => {
  let serverItems: CanonItem<unknown>[]

  // setup / teardown phase
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Seed the Fake database with one item of each type to edit.
    serverItems = [
      {
        id: "item-work",
        user_id: "user_123",
        item_type_id: TYPE_ID_BY_NAME["Work Experience"],
        title: "Developer",
        position: 0,
        content: {
          role: "Developer",
          org: "Old Corp",
        },
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "item-edu",
        user_id: "user_123",
        item_type_id: TYPE_ID_BY_NAME["Education"],
        title: "Initial Edu",
        position: 1,
        content: {
          institution: "Initial Edu",
        },
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "item-proj",
        user_id: "user_123",
        item_type_id: TYPE_ID_BY_NAME["Project"],
        title: "Initial Proj",
        position: 2,
        content: {
          title: "Initial Proj",
        },
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "item-skill",
        user_id: "user_123",
        item_type_id: TYPE_ID_BY_NAME["Skill"],
        title: "Initial Skill",
        position: 3,
        content: {
          category: "Initial Skill",
        },
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "item-link",
        user_id: "user_123",
        item_type_id: TYPE_ID_BY_NAME["Link"],
        title: "Initial Link",
        position: 4,
        content: {
          label: "Initial Link",
        },
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      },
    ]

    mockedListItemTypes.mockResolvedValue(DEFAULT_ITEM_TYPES)
    mockedListCanonItems.mockImplementation(async () => [...serverItems])

    mockedPatchCanonItem.mockImplementation(async (id: string, input: { title?: string; position?: number; content?: unknown }) => {
      // Find and update item in our mock db
      const index = serverItems.findIndex((i) => i.id === id)
      if (index === -1) throw new Error("Item not found")
        
      const updatedItem = {
        ...serverItems[index],
        ...input,
        content: input.content ?? serverItems[index].content,
        updated_at: new Date().toISOString()
      }
      
      serverItems[index] = updatedItem as CanonItem<unknown>
      return updatedItem as CanonItem<unknown>
    })
  })

  it("edits one of each item type", async () => {
    render(<CanonComponent />)
    
    // Wait for the initial items to be loaded and rendered
    await waitFor(() => {
      expect(screen.getByText("Developer")).toBeInTheDocument()
    })

    // Different configurations needed to test each item type.
    const typeCases = [
      {
        initialText: "Developer", // WorkCard renders c.role as its title
        fill: () => {
          fireEvent.change(getFieldControl(/position/i), { target: { value: "Software Engineer" } }) // maps to role
          fireEvent.change(getFieldControl(/company/i), { target: { value: "Microsoft" } }) // maps to org
          fireEvent.change(getFieldControl(/location/i), { target: { value: "Redmond, WA" } })
          fireEvent.change(getFieldControl(/start date/i), { target: { value: "2024-01-01" } })
          fireEvent.change(getFieldControl(/bullet points/i), { target: { value: "Worked on Windows" } })
        },
        expectedText: "Software Engineer", // role is the new card title
      },
      {
        initialText: "Initial Edu", // EducationCard renders c.institution as its title
        fill: () => {
          fireEvent.change(getFieldControl(/institution/i), { target: { value: "UCSC" } })
          fireEvent.change(getFieldControl(/location/i), { target: { value: "CA" } })
        },
        expectedText: "UCSC",
      },
      {
        initialText: "Initial Proj", // ProjectCard renders c.title as its title
        fill: () => {
          fireEvent.change(getFieldControl(/project name/i), { target: { value: "My Project" } })
          fireEvent.change(getFieldControl(/bullet points/i), { target: { value: "Built app" } })
        },
        expectedText: "My Project",
      },
      {
        initialText: "Initial Skill", // SkillCard renders c.category as its title
        fill: () => {
          fireEvent.change(getFieldControl(/category/i), { target: { value: "Languages" } })
          fireEvent.change(getFieldControl(/skills/i), { target: { value: "JavaScript" } })
        },
        expectedText: "Languages",
      },
      {
        initialText: "Initial Link", // LinkCard renders c.label as its title
        fill: () => {
          fireEvent.change(getFieldControl(/label/i), { target: { value: "GitHub" } })
          fireEvent.change(getFieldControl(/^url/i), { target: { value: "github.com/user" } })
        },
        expectedText: "GitHub",
      },
    ]

    for (const typeCase of typeCases) {
      // Walk from the visible card title up to the `.card` container, then find its Edit button.
      // This scopes the button lookup to the correct card so we never accidentally click the wrong one.
      const titleEl = screen.getByText(typeCase.initialText)
      const card = titleEl.closest(".card")
      if (!card) throw new Error(`Could not find .card container for "${typeCase.initialText}"`)
      
      const editButton = card.querySelector("button.card-action-edit") as HTMLButtonElement | null
      if (!editButton) throw new Error(`Could not find Edit button inside card for "${typeCase.initialText}"`)
      
      // open edit form for this item
      fireEvent.click(editButton)

      // Wait for form to open (button text becomes "Update" for edits)
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /update/i })).toBeInTheDocument()
      })

      // based on the type of item, fill it specifically for that type
      typeCase.fill()
      
      // submit the edit
      fireEvent.click(screen.getByRole("button", { name: /update/i }))

      // verify that the new text appears in the list
      await waitFor(() => {
        expect(screen.getByText(typeCase.expectedText)).toBeInTheDocument()
      })
      
      // verify the old text is gone
      expect(screen.queryByText(typeCase.initialText)).not.toBeInTheDocument()
    }
  })
})

