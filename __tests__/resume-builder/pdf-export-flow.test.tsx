import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import ResumeBuilderPage from "@/app/resume/resume-client"
import { useWorkingState } from "@/lib/working-state/useWorkingState"
import { useCanon } from "@/lib/canon/useCanon"
import type { CanonItem, ItemType } from "@/lib/shared/types"

const toastErrorMock = jest.fn()

jest.mock("react-hot-toast", () => ({
  __esModule: true,
  default: {
    loading: jest.fn(),
    dismiss: jest.fn(),
    success: jest.fn(),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
  Toaster: () => null,
}))

jest.mock("@/lib/working-state/useWorkingState")
jest.mock("@/lib/canon/useCanon")
jest.mock("next/link", () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>
})

jest.mock("@/lib/resume-builder/components/ResumeBuilderPreview", () => ({
  ResumeBuilderPreview: ({ sections, profile }: any) => (
    <div data-testid="resume-preview">
      <div>Preview for {profile.name}</div>
      <div>{sections.length} sections</div>
    </div>
  ),
}))

const makeItemType = (overrides?: Partial<ItemType>): ItemType => ({
  id: "work",
  display_name: "Work",
  user_id: "user_123",
  created_at: "2024-01-01",
  ...overrides,
})

const mockItemTypes: ItemType[] = [
  makeItemType({ id: "work", display_name: "Work Experience" }),
]

const mockItems: CanonItem[] = [
  {
    id: "item-1",
    item_type_id: "work",
    position: 0,
    title: "Senior Developer",
    content: { role: "Senior Developer", org: "Company A" },
    user_id: "user_123",
    created_at: "2024-01-01",
    updated_at: "2024-01-01",
  } as CanonItem,
]

const makeWorkingStateMock = (overrides = {}) => ({
  state: { sections: [], overrides: {}, template_id: "classic" },
  loading: false,
  saving: false,
  isDirty: false,
  isSelected: jest.fn().mockReturnValue(false),
  toggleItem: jest.fn(),
  updateStateLocally: jest.fn(),
  syncToBackend: jest.fn().mockResolvedValue(undefined),
  updatedAt: null,
  getOverride: jest.fn(),
  saveOverride: jest.fn().mockResolvedValue(undefined),
  clearOverride: jest.fn().mockResolvedValue(undefined),
  setTemplate: jest.fn().mockResolvedValue(undefined),
  setTailoringContext: jest.fn().mockResolvedValue(undefined),
  ...overrides,
})

function deferredResponse() {
  let resolve!: (value: Response) => void
  const promise = new Promise<Response>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

describe("Resume Builder PDF export flow", () => {
  let createElementSpy: jest.SpyInstance
  let anchorClickSpy: jest.Mock
  let lastCreatedDownloadAnchor: HTMLAnchorElement | null
  let originalCreateObjectURL: ((obj: Blob | MediaSource) => string) | undefined
  let originalRevokeObjectURL: ((url: string) => void) | undefined

  beforeEach(() => {
    jest.clearAllMocks()

    ;(useCanon as jest.Mock).mockReturnValue({
      allItems: mockItems,
      itemTypes: mockItemTypes,
      loading: false,
      patch: jest.fn(),
    })

    ;(useWorkingState as jest.Mock).mockReturnValue(makeWorkingStateMock())

    ;(global.fetch as unknown as jest.Mock) = jest.fn()

    originalCreateObjectURL = (URL as any).createObjectURL
    originalRevokeObjectURL = (URL as any).revokeObjectURL
    ;(URL as any).createObjectURL = jest.fn(() => "blob:resume-url")
    ;(URL as any).revokeObjectURL = jest.fn()

    anchorClickSpy = jest.fn()
    lastCreatedDownloadAnchor = null
    const originalCreateElement = document.createElement.bind(document)
    createElementSpy = jest.spyOn(document, "createElement").mockImplementation((tagName: string) => {
      const node = originalCreateElement(tagName)
      if (tagName.toLowerCase() === "a") {
        const anchor = node as HTMLAnchorElement
        anchor.click = anchorClickSpy
        lastCreatedDownloadAnchor = anchor
      }
      return node
    })
  })

  afterEach(() => {
    ;(URL as any).createObjectURL = originalCreateObjectURL
    ;(URL as any).revokeObjectURL = originalRevokeObjectURL
    createElementSpy.mockRestore()
  })

  it("Scenario 1: requests /api/resume/compile/pdf and starts resume.pdf download", async () => {
    ;(global.fetch as unknown as jest.Mock).mockResolvedValue({
      ok: true,
      blob: async () => new Blob(["pdf-bytes"], { type: "application/pdf" }),
    })

    render(
      <ResumeBuilderPage
        userName="Test User"
        userId="user_123"
        versionName={null}
        versionSavedAt={null}
        parentVersionId={null}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Export PDF/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/resume/compile/pdf",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      )
    })

    await waitFor(() => {
      expect(anchorClickSpy).toHaveBeenCalledTimes(1)
    })

    expect(lastCreatedDownloadAnchor).toBeTruthy()
    expect(lastCreatedDownloadAnchor?.download).toBe("resume.pdf")
  })

  it("Scenario 2: button enters loading/disabled state and resets after completion", async () => {
    const pending = deferredResponse()
    ;(global.fetch as unknown as jest.Mock).mockReturnValue(pending.promise)

    render(
      <ResumeBuilderPage
        userName="Test User"
        userId="user_123"
        versionName={null}
        versionSavedAt={null}
        parentVersionId={null}
      />
    )

    const exportButton = screen.getByRole("button", { name: /Export PDF/i })
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(exportButton).toBeDisabled()
    })

    pending.resolve({
      ok: true,
      blob: async () => new Blob(["pdf-bytes"], { type: "application/pdf" }),
    } as unknown as Response)

    await waitFor(() => {
      expect(exportButton).not.toBeDisabled()
    })
  })

  it("Scenario 3: on failure shows feedback and allows retry", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    ;(global.fetch as unknown as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "pdf failed" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(["pdf-bytes"], { type: "application/pdf" }),
      })

    render(
      <ResumeBuilderPage
        userName="Test User"
        userId="user_123"
        versionName={null}
        versionSavedAt={null}
        parentVersionId={null}
      />
    )

    const exportButton = screen.getByRole("button", { name: /Export PDF/i })
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("PDF export failed")
    })
    await waitFor(() => {
      expect(exportButton).not.toBeDisabled()
    })

    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(anchorClickSpy).toHaveBeenCalledTimes(1)
    })

    ;(console.error as jest.Mock).mockRestore()
  })
})
