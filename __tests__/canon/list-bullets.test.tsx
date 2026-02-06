import { render, screen } from "@testing-library/react"
import { CanonList } from "@/lib/canon/components/CanonList"
import type { CanonItem, ItemType } from "@/lib/types"

describe("CanonList bullet rendering", () => {
  it("renders bullets for any card type when content.bullets exists", () => {
    const itemTypes: ItemType[] = [
      { id: "11111111-1111-4111-8111-111111111111", user_id: "user_123", display_name: "Work Experience", created_at: "2026-01-01T00:00:00.000Z" },
      { id: "22222222-2222-4222-8222-222222222222", user_id: "user_123", display_name: "Education", created_at: "2026-01-01T00:00:00.000Z" },
      { id: "33333333-3333-4333-8333-333333333333", user_id: "user_123", display_name: "Project", created_at: "2026-01-01T00:00:00.000Z" },
      { id: "44444444-4444-4444-8444-444444444444", user_id: "user_123", display_name: "Skill", created_at: "2026-01-01T00:00:00.000Z" },
      { id: "55555555-5555-4555-8555-555555555555", user_id: "user_123", display_name: "Link", created_at: "2026-01-01T00:00:00.000Z" },
      { id: "66666666-6666-4666-8666-666666666666", user_id: "user_123", display_name: "Custom Type", created_at: "2026-01-01T00:00:00.000Z" },
    ]

    const items: CanonItem<unknown>[] = [
      {
        id: "item-1",
        user_id: "user_123",
        item_type_id: itemTypes[0].id,
        title: "Work item",
        position: 0,
        content: { org: "Acme", role: "Engineer", bullets: ["Work bullet line"] },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "item-2",
        user_id: "user_123",
        item_type_id: itemTypes[1].id,
        title: "Education item",
        position: 1,
        content: { institution: "UCSC", bullets: ["Education bullet line"] },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "item-3",
        user_id: "user_123",
        item_type_id: itemTypes[2].id,
        title: "Project item",
        position: 2,
        content: { title: "Portfolio", bullets: ["Project bullet line"] },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "item-4",
        user_id: "user_123",
        item_type_id: itemTypes[3].id,
        title: "Skill item",
        position: 3,
        content: { category: "Languages", skills: ["TypeScript"], bullets: ["Skill bullet line"] },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "item-5",
        user_id: "user_123",
        item_type_id: itemTypes[4].id,
        title: "Link item",
        position: 4,
        content: { label: "GitHub", url: "https://github.com/test", bullets: ["Link bullet line"] },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "item-6",
        user_id: "user_123",
        item_type_id: itemTypes[5].id,
        title: "Misc item",
        position: 5,
        content: { title: "Custom", bullets: ["Misc bullet line"] },
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
      },
    ]

    render(
      <CanonList items={items} itemTypes={itemTypes} onEdit={() => {}} onDelete={() => {}} isSelected={() => false} toggleItem={() => {}} />,
    )

    const expectedBullets = [
      "Work bullet line",
      "Education bullet line",
      "Project bullet line",
      "Skill bullet line",
      "Link bullet line",
      "Misc bullet line",
    ]

    for (const text of expectedBullets) {
      const bullet = screen.getByText(text)
      expect(bullet).toBeInTheDocument()
      expect(bullet.closest("li")).toBeInTheDocument()
    }
  })
})
