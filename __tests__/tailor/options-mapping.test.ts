import {
  DEFAULT_TAILORING_AXES,
  mapTailoringAxesToPromptParams,
  normalizeTailoringAxes,
} from "@/lib/resume-builder/tailor/options"

describe("tailoring axis-to-prompt mapping", () => {
  it("maps default axis values to mid-level prompt parameters", () => {
    const result = mapTailoringAxesToPromptParams(DEFAULT_TAILORING_AXES)

    expect(result).toEqual({
      industryFocus: "domain-aware",
      toneStyle: "confident",
      technicalDetail: "balanced",
      lengthTarget: "standard",
      directives: [
        "Industry focus: domain-aware",
        "Tone: confident",
        "Technical detail: balanced",
        "Length target: standard",
      ],
    })
  })

  it("maps low-end values to low-level prompt parameters", () => {
    const result = mapTailoringAxesToPromptParams({
      industry: 0,
      tone: 0.1,
      technicalDepth: 0.2,
      length: 0.33,
    })

    expect(result.industryFocus).toBe("general")
    expect(result.toneStyle).toBe("neutral")
    expect(result.technicalDetail).toBe("concise")
    expect(result.lengthTarget).toBe("tight")
  })

  it("maps high-end values to high-level prompt parameters", () => {
    const result = mapTailoringAxesToPromptParams({
      industry: 0.67,
      tone: 0.8,
      technicalDepth: 0.95,
      length: 1,
    })

    expect(result.industryFocus).toBe("highly-targeted")
    expect(result.toneStyle).toBe("executive")
    expect(result.technicalDetail).toBe("deep")
    expect(result.lengthTarget).toBe("expanded")
  })

  it("normalizes out-of-range values before mapping", () => {
    const normalized = normalizeTailoringAxes({
      industry: -2,
      tone: 3,
      technicalDepth: 0.5,
      length: 100,
    })

    expect(normalized).toEqual({
      industry: 0,
      tone: 1,
      technicalDepth: 0.5,
      length: 1,
    })
  })
})
