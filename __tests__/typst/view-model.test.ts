import { buildResumeViewModel } from "@/lib/typst/view-model"
import { mockWorkItem1, mockWorkItem3 } from "@/__tests__/utils/mockData"

describe("buildResumeViewModel", () => {
  it("maps Work Experience items into work entries with parsed dates", () => {
    const raw = {
      profile: { name: "Test" },
      sections: [
        { typeName: "Work Experience", items: [mockWorkItem1] },
        { typeName: "Work Experience", items: [mockWorkItem3] },
      ],
    }

    const vm = buildResumeViewModel(raw)
    const workSections = vm.sections.filter((s) => s.title === "Work Experience")
    expect(workSections).toHaveLength(2)

    const entry = workSections[0].entries[0]
    expect(entry.kind).toBe("work")
    if (entry.kind !== "work") throw new Error("expected work entry")

    expect(entry.organization).toBe("Tech Corp")
    expect(entry.position).toBe("Software Engineer")
    expect(entry.skills).toEqual(["React", "Node.js", "TypeScript", "PostgreSQL", "Next.js"])
    expect(entry.bullets.length).toBeGreaterThan(0)
    expect(entry.dates.start).toEqual({ year: 2022, month: 1 })
    expect(entry.dates.end).toEqual({ year: 2024, month: 1 })

    const openEnded = workSections[1].entries[0]
    expect(openEnded.kind).toBe("work")
    if (openEnded.kind !== "work") throw new Error("expected work entry")
    expect(openEnded.dates.end).toBeNull()
  })

  it("maps Education items into school entries and combines degree + field", () => {
    const raw = {
      profile: { name: "Test" },
      sections: [
        {
          typeName: "Education",
          items: [
            {
              title: "UC Santa Cruz",
              content: {
                institution: "UC Santa Cruz",
                location: "Santa Cruz, CA",
                degree: "B.S.",
                field: "Computer Science",
                start: "2024-09-26",
                end: "2026-06-12",
                gpa: "3.74",
                bullets: ["Dean's List"],
              },
            },
          ],
        },
      ],
    }

    const vm = buildResumeViewModel(raw)
    expect(vm.sections).toHaveLength(1)
    expect(vm.sections[0].title).toBe("Education")

    const entry = vm.sections[0].entries[0]
    expect(entry.kind).toBe("school")
    if (entry.kind !== "school") throw new Error("expected school entry")

    expect(entry.institution).toBe("UC Santa Cruz")
    expect(entry.location).toBe("Santa Cruz, CA")
    expect(entry.degree).toBe("B.S., Computer Science")
    expect(entry.gpa).toBe("3.74")
    expect(entry.dates.start).toEqual({ year: 2024, month: 9 })
    expect(entry.dates.end).toEqual({ year: 2026, month: 6 })
  })

  it("normalizes Skills sections into a single Skills section with items", () => {
    const raw = {
      profile: { name: "Test" },
      sections: [
        {
          typeName: "Technical Skills",
          items: [
            { title: "Languages", content: { category: "Languages", skills: ["TypeScript", "Python"] } },
            { title: "Empty", content: { category: "Empty", skills: [] } },
          ],
        },
      ],
    }

    const vm = buildResumeViewModel(raw)
    expect(vm.sections).toHaveLength(1)
    expect(vm.sections[0].title).toBe("Skills")

    const entry = vm.sections[0].entries[0]
    expect(entry.kind).toBe("skills")
    if (entry.kind !== "skills") throw new Error("expected skills entry")

    expect(entry.items).toEqual([{ label: "Languages", values: ["TypeScript", "Python"] }])
  })

  it("extracts Link sections into profile.links and sanitizes hrefs", () => {
    const raw = {
      profile: {
        name: "Test",
        links: [{ text: "Website", href: "https://example.com" }],
      },
      sections: [
        {
          typeName: "Link",
          items: [
            { title: "LinkedIn", content: { url: "https://linkedin.com/in/test", label: "LinkedIn" } },
            { title: "Bad", content: { url: "github.com/test", label: "GitHub" } },
            { title: "NoLabel", content: { url: "https://example.com" } },
          ],
        },
        { typeName: "Awards", items: [{ title: "Dean's List", content: {} }] },
      ],
    }

    const vm = buildResumeViewModel(raw)
    expect(vm.profile.links).toEqual(
      expect.arrayContaining([
        { text: "Website", href: "https://example.com" },
        { text: "LinkedIn", href: "https://linkedin.com/in/test" },
        { text: "GitHub", href: undefined },
        { text: "NoLabel", href: "https://example.com" },
      ])
    )

    // Link sections should not render as normal resume sections.
    expect(vm.sections.some((s) => s.title === "Link" || s.title === "Links")).toBe(false)
    // Unknown sections are ignored for now.
    expect(vm.sections.some((s) => s.title === "Awards")).toBe(false)
  })

  it("deduplicates merged profile links by text + href", () => {
    const raw = {
      profile: {
        name: "Test",
        links: [
          { text: "LinkedIn", href: "https://linkedin.com/in/test" },
          { text: "LinkedIn", href: "https://linkedin.com/in/test" },
        ],
      },
      sections: [
        {
          typeName: "Links",
          items: [
            { title: "LinkedIn", content: { label: "LinkedIn", url: "https://linkedin.com/in/test" } },
            { title: "GitHub", content: { label: "GitHub", url: "https://github.com/test" } },
          ],
        },
      ],
    }

    const vm = buildResumeViewModel(raw)
    expect(vm.profile.links).toEqual([
      { text: "LinkedIn", href: "https://linkedin.com/in/test" },
      { text: "GitHub", href: "https://github.com/test" },
    ])
  })

  it("handles partial and invalid date strings without crashing", () => {
    const raw = {
      profile: { name: "Test" },
      sections: [
        {
          typeName: "Projects",
          items: [
            {
              title: "YearOnly",
              content: {
                start: "2025",
                end: "2026-13-01", // invalid month should degrade to year only
                bullets: ["A"],
                skills: ["TypeScript"],
              },
            },
            {
              title: "InvalidStart",
              content: {
                start: "not-a-date",
                end: "",
                bullets: ["B"],
                skills: [],
              },
            },
          ],
        },
      ],
    }

    const vm = buildResumeViewModel(raw)
    expect(vm.sections).toHaveLength(1)
    expect(vm.sections[0].entries).toHaveLength(2)

    const first = vm.sections[0].entries[0]
    expect(first.kind).toBe("project")
    if (first.kind !== "project") throw new Error("expected project entry")
    expect(first.dates.start).toEqual({ year: 2025 })
    expect(first.dates.end).toEqual({ year: 2026 })

    const second = vm.sections[0].entries[1]
    expect(second.kind).toBe("project")
    if (second.kind !== "project") throw new Error("expected project entry")
    expect(second.dates.start).toBeNull()
    expect(second.dates.end).toBeNull()
  })

  it("drops empty skills sections instead of emitting empty entries", () => {
    const raw = {
      profile: { name: "Test" },
      sections: [
        {
          typeName: "Skills",
          items: [
            { title: "Bad1", content: { category: "", skills: ["TypeScript"] } },
            { title: "Bad2", content: { category: "Languages", skills: [] } },
          ],
        },
      ],
    }

    const vm = buildResumeViewModel(raw)
    expect(vm.sections).toEqual([])
  })
})

