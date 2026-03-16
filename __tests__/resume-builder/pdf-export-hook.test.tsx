/**
 * Hook-level tests for PDF export behavior in `useResumeBuilder`.
 *
 * Scope:
 * - correct payload/template passed to compile API
 * - browser download primitives are invoked correctly
 * - `exportingPdf` state transitions for success/failure
 */
import { renderHook, act } from "@testing-library/react"
import { useResumeBuilder } from "@/lib/resume-builder/useResumeBuilder"
import type { CanonItem, ItemType } from "@/lib/shared/types"

const mockCompileResumeToPdf = jest.fn()
jest.mock("@/lib/resume-builder/api", () => ({
  compileResumeToPdf: (...args: unknown[]) => mockCompileResumeToPdf(...args),
}))

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    loading: jest.fn(),
    dismiss: jest.fn(),
    error: jest.fn(),
  },
}))

const mockUseCanon = jest.fn()
jest.mock("@/lib/canon/useCanon", () => ({
  useCanon: () => mockUseCanon(),
}))

const mockUseWorkingState = jest.fn()
jest.mock("@/lib/working-state/useWorkingState", () => ({
  useWorkingState: () => mockUseWorkingState(),
}))

const mockUseResumeSections = jest.fn()
jest.mock("@/lib/resume-builder/useResumeSection", () => ({
  useResumeSections: (...args: unknown[]) => mockUseResumeSections(...args),
}))

const mockUseDragState = jest.fn()
jest.mock("@/lib/resume-builder/useDragState", () => ({
  useDragState: (...args: unknown[]) => mockUseDragState(...args),
}))

/**
 * Creates a controllable promise for testing "during async work" state.
 */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe("useResumeBuilder PDF export", () => {
  const itemTypes: ItemType[] = [
    { id: "work", display_name: "Work Experience", user_id: "u1", created_at: "" },
  ]
  const items: CanonItem[] = [
    {
      id: "item-1",
      item_type_id: "work",
      title: "Developer",
      position: 0,
      user_id: "u1",
      created_at: "",
      updated_at: "",
      content: { role: "Developer" },
    } as CanonItem,
  ]
  const sections = [{ typeId: "work", typeName: "Work Experience", items }]

  let createElementSpy: jest.SpyInstance
  let anchorClickSpy: jest.Mock
  let originalCreateObjectURL: ((obj: Blob | MediaSource) => string) | undefined
  let originalRevokeObjectURL: ((url: string) => void) | undefined

  beforeEach(() => {
    jest.clearAllMocks()

    // Minimal environment needed for the hook to compute preview/export data.
    mockUseCanon.mockReturnValue({
      allItems: items,
      itemTypes,
      loading: false,
    })

    mockUseWorkingState.mockReturnValue({
      state: { sections: [], overrides: {}, template_id: "classic" },
      loading: false,
      saving: false,
      isDirty: false,
      isSelected: jest.fn().mockReturnValue(false),
      toggleItem: jest.fn(),
      updateStateLocally: jest.fn(),
      syncToBackend: jest.fn(),
      updatedAt: null,
      getOverride: jest.fn(),
      saveOverride: jest.fn(),
      clearOverride: jest.fn(),
      setTemplate: jest.fn(),
      setTailoringContext: jest.fn(),
    })

    mockUseResumeSections.mockReturnValue({
      sections,
      setSections: jest.fn(),
    })

    mockUseDragState.mockReturnValue({
      draggedItem: null,
      setDraggedItem: jest.fn(),
      draggedSection: null,
      setDraggedSection: jest.fn(),
      handleItemDragEnd: jest.fn(),
      isDragging: false,
    })

    // Stub blob URL APIs used by the download implementation.
    originalCreateObjectURL = (URL as any).createObjectURL
    originalRevokeObjectURL = (URL as any).revokeObjectURL
      ; (URL as any).createObjectURL = jest.fn(() => "blob:resume-url")
      ; (URL as any).revokeObjectURL = jest.fn()

    // Intercept anchor creation to verify download trigger attributes and click.
    anchorClickSpy = jest.fn()
    const originalCreateElement = document.createElement.bind(document)
    createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const node = originalCreateElement(tagName)
      if (tagName.toLowerCase() === "a") {
        ; (node as HTMLAnchorElement).click = anchorClickSpy
      }
      return node
    })
  })

  afterEach(() => {
    ; (URL as any).createObjectURL = originalCreateObjectURL
      ; (URL as any).revokeObjectURL = originalRevokeObjectURL
    createElementSpy.mockRestore()
  })

  // Success path: API call payload and download side effects.
  it("exports a PDF and triggers a resume.pdf download", async () => {
    mockCompileResumeToPdf.mockResolvedValue(new Blob(["pdf-content"], { type: "application/pdf" }))

    const { result } = renderHook(() => useResumeBuilder("Test User"))

    await act(async () => {
      await result.current.handleExportPdf()
    })

    expect(mockCompileResumeToPdf).toHaveBeenCalledWith(
      {
        profile: { name: "Test User" },
        sections,
      },
      "classic"
    )
    expect((URL as any).createObjectURL).toHaveBeenCalled()
    expect(anchorClickSpy).toHaveBeenCalledTimes(1)

    const anchor = createElementSpy.mock.results.find(
      (r) => r.type === "return" && r.value instanceof HTMLAnchorElement
    )?.value as HTMLAnchorElement
    expect(anchor.href).toBe("blob:resume-url")
    expect(anchor.download).toBe("resume.pdf")
    expect((URL as any).revokeObjectURL).toHaveBeenCalledWith("blob:resume-url")
  })

  // In-flight state should be true during export and false afterwards.
  it("sets exportingPdf during export and resets after completion", async () => {
    const pending = deferred<Blob>()
    mockCompileResumeToPdf.mockReturnValue(pending.promise)
    const { result } = renderHook(() => useResumeBuilder("Test User"))

    let exportPromise: Promise<void>
    act(() => {
      exportPromise = result.current.handleExportPdf()
    })

    expect(result.current.exportingPdf).toBe(true)

    await act(async () => {
      pending.resolve(new Blob(["pdf-content"], { type: "application/pdf" }))
      await exportPromise
    })

    expect(result.current.exportingPdf).toBe(false)
  })

  // Failure path should still clean up loading state.
  it("resets exportingPdf when export fails", async () => {
    jest.spyOn(console, "error").mockImplementation(() => { })
    mockCompileResumeToPdf.mockRejectedValue(new Error("Export failed"))
    const { result } = renderHook(() => useResumeBuilder("Test User"))

    await act(async () => {
      await result.current.handleExportPdf()
    })

    expect(result.current.exportingPdf).toBe(false)
    expect(console.error).toHaveBeenCalled()
      ; (console.error as jest.Mock).mockRestore()
  })
})
