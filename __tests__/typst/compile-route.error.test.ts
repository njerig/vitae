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
})

