import { render, screen, waitFor, within } from "@testing-library/react"
import { CanonList } from "@/lib/canon/components/CanonList"
import { useCanon } from "@/lib/canon/useCanon"
import type { ItemType } from "@/lib/shared/types"
import * as canonApi from "@/lib/canon/api"

// Mock the API calls (so that we don't need to make actual API calls to test the components)
jest.mock("@/lib/canon/api", () => {
  const actual = jest.requireActual("@/lib/canon/api")
  return {
    ...actual,
    listItemTypes: jest.fn(),
    listCanonItems: jest.fn(),
  }
})

const mockedListItemTypes = canonApi.listItemTypes as jest.MockedFunction<typeof canonApi.listItemTypes>
const mockedListCanonItems = canonApi.listCanonItems as jest.MockedFunction<typeof canonApi.listCanonItems>

// Define the item types that we will test with
const ITEM_TYPES: ItemType[] = [
  { id: "work", user_id: "u1", display_name: "Work Experience", created_at: "" },
  { id: "education", user_id: "u1", display_name: "Education", created_at: "" },
  { id: "skill", user_id: "u1", display_name: "Skill", created_at: "" },
]

// A component that allows us to easily access the list and item types for testing
function CanonViewHarness() {
  const { items, itemTypes, loading } = useCanon()

  if (loading) return <p>Loading...</p>

  return (
    <CanonList
      items={items}
      itemTypes={itemTypes}
      onEdit={() => { }}
      onDelete={() => { }}
    />
  )
}

describe("Career history canon view", () => {
  // Setup / teardown phase
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    // Mock the item types to return the predefined item types
    mockedListItemTypes.mockResolvedValue(ITEM_TYPES)
  })

  it("shows canon items and groups them by type order after loading from API", async () => {
    // Deliberately unsorted from API: skill, work, education.
    mockedListCanonItems.mockResolvedValue([
      {
        id: "s1",
        user_id: "u1",
        item_type_id: "skill",
        title: "Skills",
        position: 2,
        content: { category: "Languages", skills: ["TypeScript"] },
        created_at: "",
        updated_at: "",
      },
      {
        id: "w1",
        user_id: "u1",
        item_type_id: "work",
        title: "Work",
        position: 0,
        content: { role: "Software Engineer", org: "Acme", start: "2022-01-01" },
        created_at: "",
        updated_at: "",
      },
      {
        id: "e1",
        user_id: "u1",
        item_type_id: "education",
        title: "Education",
        position: 1,
        content: { institution: "State University", start: "2018-01-01" },
        created_at: "",
        updated_at: "",
      },
    ] as any)

    const { container } = render(<CanonViewHarness />)

    await waitFor(() => {
      expect(mockedListCanonItems).toHaveBeenCalledTimes(1)
    })
    expect(mockedListItemTypes).toHaveBeenCalledTimes(1)

    // Records from `GET /api/canon` should be visible.
    expect(screen.getByText("Software Engineer")).toBeInTheDocument()
    expect(screen.getByText("State University")).toBeInTheDocument()
    expect(screen.getByText("Languages")).toBeInTheDocument()

    // Grouping by type is represented by canonical ordering:
    // Work -> Education -> Skill.
    const titles = within(container).getAllByRole("heading", { level: 4 })
    expect(titles.map((h) => h.textContent)).toEqual([
      "Software Engineer",
      "State University",
      "Languages",
    ])
  })

  it("shows empty state when no canon items exist", async () => {
    // Mock the canon items to return an empty array
    mockedListCanonItems.mockResolvedValue([])

    const { container } = render(<CanonViewHarness />)

    await waitFor(() => {
      expect(mockedListCanonItems).toHaveBeenCalledTimes(1)
    })

    // The empty state should be visible 
    expect(screen.getByText("No items yet")).toBeInTheDocument()
    // No headings should be visible
    expect(within(container).queryAllByRole("heading", { level: 4 })).toHaveLength(0)
  })
})
