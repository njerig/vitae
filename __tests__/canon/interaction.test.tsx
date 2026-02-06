import { useState } from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { CanonForm } from "@/lib/canon/components/CanonForm"
import { CanonList } from "@/lib/canon/components/CanonList"
import { useCanon } from "@/lib/canon/useCanon"
import type { CanonItem, ItemType } from "@/lib/types"
import * as canonApi from "@/lib/canon/api"
import { ValidationError } from "@/lib/canon/api"
import { getContentSchema } from "@/lib/schemas"

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

const DEFAULT_ITEM_TYPES: ItemType[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: "user_123",
    display_name: "Work Experience",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    user_id: "user_123",
    display_name: "Education",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    user_id: "user_123",
    display_name: "Project",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    user_id: "user_123",
    display_name: "Skill",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    user_id: "user_123",
    display_name: "Link",
    created_at: "2026-01-01T00:00:00.000Z",
  },
]

const TYPE_ID_BY_NAME = Object.fromEntries(DEFAULT_ITEM_TYPES.map((type) => [type.display_name, type.id]))

const mockedListItemTypes = canonApi.listItemTypes as jest.MockedFunction<typeof canonApi.listItemTypes>
const mockedListCanonItems = canonApi.listCanonItems as jest.MockedFunction<typeof canonApi.listCanonItems>
const mockedCreateCanonItem = canonApi.createCanonItem as jest.MockedFunction<typeof canonApi.createCanonItem>
const mockedPatchCanonItem = canonApi.patchCanonItem as jest.MockedFunction<typeof canonApi.patchCanonItem>
const mockedDeleteCanonItem = canonApi.deleteCanonItem as jest.MockedFunction<typeof canonApi.deleteCanonItem>

type ValidationIssue = {
  path: Array<string | number>
  message: string
}

function buildValidationError(issues: ValidationIssue[]) {
  const fields = issues
    .map((issue) => (typeof issue.path[0] === "string" ? issue.path[0] : ""))
    .filter((field): field is string => Boolean(field))
  const message = issues.map((issue) => `• ${issue.message}`).join("\n")
  return new ValidationError(message, fields)
}

function CanonFlowHarness() {
  const { items, itemTypes, create, saving, error } = useCanon()
  const [isAddingItem, setIsAddingItem] = useState(false)

  const submit = async (payload: { item_type_id: string; title: string; position: number; content: Record<string, unknown> }) => {
    try {
      await create(payload)
      setIsAddingItem(false)
    } catch {
      // Keep the form open to show inline errors.
    }
  }

  return (
    <div>
      <button onClick={() => setIsAddingItem(true)} disabled={itemTypes.length === 0}>
        Open Add Item Form
      </button>
      {isAddingItem && (
        <CanonForm
          itemTypes={itemTypes}
          onCancel={() => setIsAddingItem(false)}
          onSubmit={submit}
          saving={saving}
          error={error}
        />
      )}
      <CanonList
        items={items}
        itemTypes={itemTypes}
        onEdit={() => {}}
        onDelete={async () => {}}
        isSelected={() => false}
        toggleItem={() => {}}
      />
    </div>
  )
}

function openForm() {
  fireEvent.click(screen.getByRole("button", { name: /open add item form/i }))
}

function getFieldControl(labelPattern: string | RegExp) {
  const label = screen.getByText(labelPattern, { selector: "label" })
  const control = label.parentElement?.querySelector("input, textarea, select")
  if (!control) {
    throw new Error(`No form control found for label: ${String(labelPattern)}`)
  }
  return control as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
}

function selectType(displayName: string) {
  fireEvent.change(getFieldControl(/item type/i), {
    target: { value: TYPE_ID_BY_NAME[displayName] },
  })
}

function submitForm() {
  fireEvent.click(screen.getByRole("button", { name: /^add item$/i }))
}

describe("Canon interaction flow", () => {
  let serverItems: CanonItem<unknown>[]
  let counter: number

  beforeEach(() => {
    jest.clearAllMocks()
    serverItems = []
    counter = 0

    mockedListItemTypes.mockResolvedValue(DEFAULT_ITEM_TYPES)
    mockedListCanonItems.mockImplementation(async (itemTypeId?: string) => {
      if (!itemTypeId) return [...serverItems]
      return serverItems.filter((item) => item.item_type_id === itemTypeId)
    })
    mockedPatchCanonItem.mockResolvedValue({} as CanonItem<unknown>)
    mockedDeleteCanonItem.mockResolvedValue()

    mockedCreateCanonItem.mockImplementation(async (input) => {
      const itemType = DEFAULT_ITEM_TYPES.find((type) => type.id === input.item_type_id)
      if (!itemType) {
        throw new Error("Invalid item_type_id")
      }

      const schema = getContentSchema(itemType.display_name)
      const parseResult = schema.safeParse((input.content ?? {}) as Record<string, unknown>)
      if (!parseResult.success) {
        throw buildValidationError(
          parseResult.error.issues.map((issue) => ({
            path: issue.path as Array<string | number>,
            message: issue.message,
          })),
        )
      }

      counter += 1
      const created: CanonItem<unknown> = {
        id: `item-${counter}`,
        user_id: "user_123",
        item_type_id: input.item_type_id,
        title: input.title ?? "",
        position: input.position ?? 0,
        content: (input.content ?? {}) as Record<string, unknown>,
        created_at: "2026-01-02T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      }
      serverItems.push(created)
      return created
    })
  })

  it("lets users switch item types and renders different forms for default types", async () => {
    render(<CanonFlowHarness />)

    await waitFor(() => expect(screen.getByRole("button", { name: /open add item form/i })).toBeEnabled())
    openForm()

    expect(screen.getByText(/company/i, { selector: "label" })).toBeInTheDocument()
    expect(screen.getByText(/position/i, { selector: "label" })).toBeInTheDocument()

    selectType("Education")
    expect(screen.getByText(/institution/i, { selector: "label" })).toBeInTheDocument()
    expect(screen.queryByText(/company/i, { selector: "label" })).not.toBeInTheDocument()

    selectType("Project")
    expect(screen.getByText(/project name/i, { selector: "label" })).toBeInTheDocument()
    expect(screen.queryByText(/institution/i, { selector: "label" })).not.toBeInTheDocument()

    selectType("Skill")
    expect(screen.getByText(/category/i, { selector: "label" })).toBeInTheDocument()
    expect(screen.queryByText(/project name/i, { selector: "label" })).not.toBeInTheDocument()

    selectType("Link")
    expect(screen.getByText(/label/i, { selector: "label" })).toBeInTheDocument()
    expect(screen.getByText(/^url/i, { selector: "label" })).toBeInTheDocument()
    expect(screen.queryByText(/category/i, { selector: "label" })).not.toBeInTheDocument()
  })

  const flowCases = [
    {
      typeName: "Work Experience",
      requiredFieldLabel: /company/i,
      requiredErrorText: "Company is required",
      fillValid: () => {
        fireEvent.change(getFieldControl(/company/i), { target: { value: "Acme Corp" } })
        fireEvent.change(getFieldControl(/position/i), { target: { value: "Senior Engineer" } })
        fireEvent.change(getFieldControl(/start date/i), { target: { value: "2024-01-01" } })
        fireEvent.change(getFieldControl(/bullet points/i), { target: { value: "Built API platform" } })
      },
      expectedListText: ["Senior Engineer", "Acme Corp"],
    },
    {
      typeName: "Education",
      requiredFieldLabel: /institution/i,
      requiredErrorText: "Institution is required",
      fillValid: () => {
        fireEvent.change(getFieldControl(/institution/i), { target: { value: "UC Santa Cruz" } })
      },
      expectedListText: ["UC Santa Cruz"],
    },
    {
      typeName: "Project",
      requiredFieldLabel: /project name/i,
      requiredErrorText: "Project Name is required",
      fillValid: () => {
        fireEvent.change(getFieldControl(/project name/i), { target: { value: "Portfolio Builder" } })
      },
      expectedListText: ["Portfolio Builder"],
    },
    {
      typeName: "Skill",
      requiredFieldLabel: /category/i,
      requiredErrorText: "Category is required",
      fillValid: () => {
        fireEvent.change(getFieldControl(/category/i), { target: { value: "Languages" } })
        fireEvent.change(getFieldControl(/skills/i), { target: { value: "TypeScript, Go" } })
      },
      expectedListText: ["Languages", "TypeScript", "Go"],
    },
    {
      typeName: "Link",
      requiredFieldLabel: /label/i,
      requiredErrorText: "Label is required",
      fillValid: () => {
        fireEvent.change(getFieldControl(/label/i), { target: { value: "GitHub" } })
        fireEvent.change(getFieldControl(/^url/i), { target: { value: "https://github.com/test" } })
      },
      expectedListText: ["GitHub", "github.com/test"],
    },
  ] as const

  it.each(flowCases)(
    "shows zod errors inline and saves $typeName items into CanonList",
    async ({ typeName, requiredFieldLabel, requiredErrorText, fillValid, expectedListText }) => {
      render(<CanonFlowHarness />)

      await waitFor(() => expect(screen.getByRole("button", { name: /open add item form/i })).toBeEnabled())
      openForm()
      selectType(typeName)

      submitForm()

      await waitFor(() => expect(screen.getByText(new RegExp(requiredErrorText, "i"))).toBeInTheDocument())
      expect(getFieldControl(requiredFieldLabel)).toHaveClass("border-red-500")

      fillValid()
      submitForm()

      await waitFor(() => expect(screen.queryByText(/item type/i, { selector: "label" })).not.toBeInTheDocument())
      for (const text of expectedListText) {
        expect(await screen.findByText(text)).toBeInTheDocument()
      }
    },
  )
})
