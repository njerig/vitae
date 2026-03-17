import { tailorCompose } from "@/lib/resume-builder/tailor/api"

const mockFetch = jest.fn()
global.fetch = mockFetch

describe("tailorCompose API wrapper", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const payload = {
    context_type: "job_description" as const,
    context_text: "Backend engineering role with distributed systems focus",
    axes: {
      industry: 0.8,
      tone: 0.7,
      technicalDepth: 0.9,
      length: 0.5,
    },
    sections: [
      {
        item_type_id: "work-type-id",
        type_name: "Work Experience",
        items: [
          {
            id: "item-1",
            title: "Software Engineer",
            content: { bullets: ["Built APIs"] },
          },
        ],
      },
    ],
  }

  it("posts unified payload to /api/tailor/compose", async () => {
    const expected = {
      sections: [{ item_type_id: "work-type-id", item_ids: ["item-1"] }],
      overrides: [{ item_id: "item-1", title: "Backend Software Engineer" }],
      axes: payload.axes,
      context_type: payload.context_type,
      context_text: payload.context_text,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => expected,
    })

    const result = await tailorCompose(payload)

    expect(result.sections).toHaveLength(1)
    expect(mockFetch).toHaveBeenCalledWith("/api/tailor/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      signal: undefined,
      body: JSON.stringify(payload),
    })
  })

  it("throws endpoint message on non-200", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "AI processing failed" }),
    })

    await expect(tailorCompose(payload)).rejects.toThrow("AI processing failed")
  })
})
