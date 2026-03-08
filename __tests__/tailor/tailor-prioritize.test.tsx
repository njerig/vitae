import { tailorPrioritize } from "@/lib/tailor/api"

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockSections = [
  {
    item_type_id: "work-type-id",
    type_name: "Work Experience",
    items: [
      {
        id: "work-1",
        title: "Software Engineer at Acme",
        content: {
          org: "Acme Corp",
          role: "Software Engineer",
          bullets: ["Built REST APIs", "Deployed to AWS"],
          skills: ["Python", "AWS"],
        },
      },
      {
        id: "work-2",
        title: "Barista at Coffee Shop",
        content: {
          org: "Coffee Shop",
          role: "Barista",
          bullets: ["Made drinks", "Customer service"],
          skills: ["Customer Service"],
        },
      },
    ],
  },
  {
    item_type_id: "education-type-id",
    type_name: "Education",
    items: [
      {
        id: "edu-1",
        title: "BS Computer Science",
        content: {
          institution: "UC Santa Cruz",
          degree: "Bachelor of Science",
          field: "Computer Science",
        },
      },
    ],
  },
  {
    item_type_id: "project-type-id",
    type_name: "Project",
    items: [
      {
        id: "proj-1",
        title: "AI Chatbot",
        content: {
          description: "Built an AI chatbot using LLMs",
          bullets: ["Used GPT-4 API", "React frontend"],
          skills: ["React", "OpenAI"],
        },
      },
      {
        id: "proj-2",
        title: "Recipe Blog",
        content: {
          description: "Personal recipe blog site",
          bullets: ["WordPress theme"],
          skills: ["WordPress"],
        },
      },
    ],
  },
]

const mockJobDescription =
  "Looking for a Software Engineer with experience in Python, AWS, and AI/ML. " +
  "Must have a CS degree and experience building production APIs."

describe("tailorPrioritize API wrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("sends the correct payload to /api/tailor/prioritize", async () => {
    const expectedResponse = {
      sections: [
        { item_type_id: "work-type-id", item_ids: ["work-1"] },
        { item_type_id: "education-type-id", item_ids: ["edu-1"] },
        { item_type_id: "project-type-id", item_ids: ["proj-1"] },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => expectedResponse,
    })

    await tailorPrioritize(mockJobDescription, mockSections)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith("/api/tailor/prioritize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_description: mockJobDescription,
        sections: mockSections,
      }),
    })
  })

  it("returns correctly shaped SectionState array", async () => {
    const apiResponse = {
      sections: [
        { item_type_id: "work-type-id", item_ids: ["work-1"] },
        { item_type_id: "project-type-id", item_ids: ["proj-1"] },
        { item_type_id: "education-type-id", item_ids: ["edu-1"] },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => apiResponse,
    })

    const result = await tailorPrioritize(mockJobDescription, mockSections)

    expect(result.sections).toHaveLength(3)
    expect(result.sections[0]).toEqual({
      item_type_id: "work-type-id",
      item_ids: ["work-1"],
    })
    expect(result.sections[0].item_ids).not.toContain("work-2")
    expect(result.sections[1].item_ids).not.toContain("proj-2")
  })

  it("throws on non-200 response with error message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "AI service not configured" }),
    })

    await expect(tailorPrioritize(mockJobDescription, mockSections)).rejects.toThrow(
      "AI service not configured"
    )
  })

  it("throws generic error when response has no error field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({}),
    })

    await expect(tailorPrioritize(mockJobDescription, mockSections)).rejects.toThrow(
      "Tailoring failed"
    )
  })

  it("throws on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    await expect(tailorPrioritize(mockJobDescription, mockSections)).rejects.toThrow("Network error")
  })

  it("handles response where json parsing fails on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => {
        throw new Error("Invalid JSON")
      },
    })

    await expect(tailorPrioritize(mockJobDescription, mockSections)).rejects.toThrow(
      "Tailoring failed"
    )
  })
})
