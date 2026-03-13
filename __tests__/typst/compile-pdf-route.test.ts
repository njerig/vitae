/**
 * @jest-environment node
 */

const mockCompileResume = jest.fn()

jest.mock("@/lib/typst/compile", () => ({
  compileResume: (...args: unknown[]) => mockCompileResume(...args),
}))

describe("/api/resume/compile/pdf (route handler)", () => {
  beforeEach(() => {
    jest.resetModules()
    mockCompileResume.mockReset()
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    ;(console.error as jest.Mock).mockRestore()
  })

  it("returns 400 when data is missing", async () => {
    const { POST } = await import("@/app/api/resume/compile/pdf/route")
    const req = { json: async () => ({}) } as any

    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "data field is required" })
  })

  it("returns a PDF with expected headers on success", async () => {
    const bytes = new Uint8Array([1, 2, 3, 4])
    mockCompileResume.mockResolvedValue(bytes)

    const { POST } = await import("@/app/api/resume/compile/pdf/route")
    const req = {
      json: async () => ({
        data: { profile: { name: "Test" }, sections: [] },
        template_id: "modern",
      }),
    } as any

    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("application/pdf")
    expect(res.headers.get("Content-Disposition")).toContain('filename="resume.pdf"')
    expect(mockCompileResume).toHaveBeenCalledWith({
      data: { profile: { name: "Test" }, sections: [] },
      templateId: "modern",
      format: "pdf",
    })

    const body = new Uint8Array(await res.arrayBuffer())
    expect(Array.from(body)).toEqual([1, 2, 3, 4])
  })

  it("returns 500 with compiler code when compile fails", async () => {
    const err = new Error("")
    ;(err as any).code = "0: pdf compile error"
    mockCompileResume.mockRejectedValue(err)

    const { POST } = await import("@/app/api/resume/compile/pdf/route")
    const req = {
      json: async () => ({
        data: { profile: {}, sections: [] },
      }),
    } as any

    const res = await POST(req)

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({ error: "0: pdf compile error" })
  })
})
