/**
 * @jest-environment node
 */
/**
 * Tests for /api/typst/compile error handling.
 *
 * We mock the native Typst compiler and file reads so tests stay fast
 * and don't depend on platform-specific bindings.
 */

const mockReadFile = jest.fn()
jest.mock("node:fs/promises", () => ({
  readFile: (...args: unknown[]) => mockReadFile(...args),
}))

const mockSvg = jest.fn()
const mockCreate = jest.fn(() => ({ svg: mockSvg }))
jest.mock("@myriaddreamin/typst-ts-node-compiler", () => ({
  NodeCompiler: { create: mockCreate },
}))

describe("/api/typst/compile (route handler)", () => {
  beforeEach(() => {
    jest.resetModules()
    mockReadFile.mockReset().mockResolvedValue("/* typst */")
    mockSvg.mockReset()
    mockCreate.mockClear()
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  it("returns 400 when data is missing", async () => {
    const { POST } = await import("@/app/api/typst/compile/route")

    const req = { json: async () => ({}) } as any
    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "data field is required" })
  })

  it("returns 400 when body is not an object", async () => {
    const { POST } = await import("@/app/api/typst/compile/route")

    const req = { json: async () => "not-an-object" } as any
    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ error: "data field is required" })
  })

  it("returns svg on success with expected content type", async () => {
    mockSvg.mockReturnValue("<svg><text>ok</text></svg>")

    const { POST } = await import("@/app/api/typst/compile/route")
    const req = { json: async () => ({ data: { profile: { name: "Test" }, sections: [] } }) } as any
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("image/svg+xml")
    await expect(res.text()).resolves.toContain("<svg")
  })

  it("uses message fallback when compiler throws normal Error", async () => {
    mockSvg.mockImplementation(() => {
      throw new Error("normal error message")
    })

    const { POST } = await import("@/app/api/typst/compile/route")
    const req = { json: async () => ({ data: { profile: {}, sections: [] } }) } as any
    const res = await POST(req)

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({ error: "normal error message" })
  })

  it("returns compiler error.code in JSON response", async () => {
    mockSvg.mockImplementation(() => {
      const err = new Error("")
      ;(err as any).code = "0: some typst error"
      throw err
    })

    const { POST } = await import("@/app/api/typst/compile/route")

    const req = { json: async () => ({ data: { profile: {}, sections: [] } }) } as any
    const res = await POST(req)

    expect(res.status).toBe(500)
    await expect(res.json()).resolves.toEqual({ error: "0: some typst error" })
  })

  it("caches compiler/template across requests in same module instance", async () => {
    mockSvg.mockReturnValue("<svg>cached</svg>")

    const { POST } = await import("@/app/api/typst/compile/route")
    const req = { json: async () => ({ data: { profile: {}, sections: [] } }) } as any

    const res1 = await POST(req)
    const res2 = await POST(req)

    expect(res1.status).toBe(200)
    expect(res2.status).toBe(200)
    expect(mockCreate).toHaveBeenCalledTimes(1)
    // theme.typ + resume.typ read once each
    expect(mockReadFile).toHaveBeenCalledTimes(2)
  })
})

