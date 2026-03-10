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
const mockedCreateCanonItem = canonApi.createCanonItem as jest.MockedFunction<typeof canonApi.createCanonItem>
const mockedDeleteCanonItem = canonApi.deleteCanonItem as jest.MockedFunction<typeof canonApi.deleteCanonItem>

// a component that allows us to easily access the form and list together for testing
// isolate the canonform and canonlist components so that we can edit them without testing the entire page
function CanonComponent() {
  const { items, itemTypes, create, remove, saving, error } = useCanon()
  const [isAddingItem, setIsAddingItem] = useState(false)

  return (
    <div>
      <button onClick={() => setIsAddingItem(true)}>Open Add Item Form</button>
      {isAddingItem && (
        <CanonForm
          itemTypes={itemTypes}
          onCancel={() => setIsAddingItem(false)}
          onSubmit={async (payload) => {
            await create(payload)
            setIsAddingItem(false)
          }}
          saving={saving}
          error={error}
        />
      )}
      <CanonList
        items={items}
        itemTypes={itemTypes}
        onEdit={() => {}}
        onDelete={(id) => remove(id)}
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

describe("Canon interaction adding / deleting items flow", () => {
  let serverItems: CanonItem<unknown>[]
  let counter = 0 // generate unique ids

  // setup / teardown phase
  beforeEach(() => {
    jest.clearAllMocks()
    serverItems = []
    counter = 0

    mockedListItemTypes.mockResolvedValue(DEFAULT_ITEM_TYPES)
    mockedListCanonItems.mockImplementation(async () => [...serverItems])

    mockedCreateCanonItem.mockImplementation(async (input) => {
      counter += 1
      const created: CanonItem<unknown> = {
        id: `item-${counter}`,
        user_id: "user_123",
        item_type_id: input.item_type_id,
        title: input.title ?? "",
        position: input.position ?? 0,
        content: input.content ?? {},
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      }
      serverItems.push(created)
      return created
    })

    mockedDeleteCanonItem.mockImplementation(async (id) => {
      serverItems = serverItems.filter((i) => i.id !== id)
    })
  })

  it("adds and deletes one of each item type", async () => {
    render(<CanonComponent />)
    await waitFor(() => expect(screen.getByRole("button", { name: /open add item form/i })).toBeEnabled())

    // Different configurations needed to test each item type.
    const typeCases = [
      {
        name: "Work Experience",
        fill: () => {
          fireEvent.change(getFieldControl(/company/i), { target: { value: "Microsoft" } })
          fireEvent.change(getFieldControl(/position/i), { target: { value: "Software Engineer" } })
          fireEvent.change(getFieldControl(/location/i), { target: { value: "Redmond, WA" } })
          fireEvent.change(getFieldControl(/start date/i), { target: { value: "2024-01-01" } })
          fireEvent.change(getFieldControl(/bullet points/i), { target: { value: "Worked on Windows" } })
        },
        expectedText: "Microsoft",
      },
      {
        name: "Education",
        fill: () => {
          fireEvent.change(getFieldControl(/institution/i), { target: { value: "UCSC" } })
          fireEvent.change(getFieldControl(/details/i), { target: { value: "BS CS" } })
          fireEvent.change(getFieldControl(/location/i), { target: { value: "CA" } })
        },
        expectedText: "UCSC",
      },
      {
        name: "Project",
        fill: () => {
          fireEvent.change(getFieldControl(/project name/i), { target: { value: "My Project" } })
          fireEvent.change(getFieldControl(/bullet points/i), { target: { value: "Built app" } })
        },
        expectedText: "My Project",
      },
      {
        name: "Skill",
        fill: () => {
          fireEvent.change(getFieldControl(/category/i), { target: { value: "Languages" } })
          fireEvent.change(getFieldControl(/skills/i), { target: { value: "JavaScript" } })
        },
        expectedText: "Languages",
      },
      {
        name: "Link",
        fill: () => {
          fireEvent.change(getFieldControl(/label/i), { target: { value: "GitHub" } })
          fireEvent.change(getFieldControl(/^url/i), { target: { value: "github.com/user" } })
        },
        expectedText: "GitHub",
      },
    ]

    for (const typeCase of typeCases) {
      // open the form
      fireEvent.click(screen.getByRole("button", { name: /open add item form/i }))
      
      // select the appropriate item type
      fireEvent.change(getFieldControl(/item type/i), {
        target: { value: TYPE_ID_BY_NAME[typeCase.name] },
      })

      // based on the type of item, fill it specifically for that type
      typeCase.fill()
      
      // save canon item
      fireEvent.click(screen.getByRole("button", { name: /^add item$/i }))

      // verify that it appears in the list
      await waitFor(() => {
        expect(screen.getByText(typeCase.expectedText)).toBeInTheDocument()
      })

      // delete the item
      const deleteButton = screen.getByRole("button", { name: /^delete$/i })
      fireEvent.click(deleteButton)

      // verify that the list is empty
      await waitFor(() => {
        expect(screen.queryByText(typeCase.expectedText)).not.toBeInTheDocument()
      })
    }
  })
})
