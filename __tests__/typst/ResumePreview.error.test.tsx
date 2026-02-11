import { render, screen, act } from "@testing-library/react"
import { ResumePreview } from "@/app/resume/ResumePreview"

async function flushMicrotasks() {
  // Flush a couple microtask turns for state updates.
  await Promise.resolve()
  await Promise.resolve()
}

describe("ResumePreview error handling", () => {
  beforeEach(() => {
    jest.useFakeTimers()
    ;(global.fetch as unknown) = jest.fn()
    jest.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  it("shows a blocking error when initial compilation fails", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "0: bad typst" }),
    })

    render(<ResumePreview sections={[]} profile={{ name: "Test" }} />)

    expect(screen.getByText("Generating preview...")).toBeInTheDocument()

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    expect(screen.getByText("Preview failed")).toBeInTheDocument()
    expect(screen.getByText("0: bad typst")).toBeInTheDocument()
  })

  it("keeps last SVG and shows non-blocking banner when updates fail", async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg><text>ok</text></svg>",
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "0: update error" }),
      })

    const { container, rerender } = render(
      <ResumePreview sections={[]} profile={{ name: "Test" }} />
    )

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    expect(container.innerHTML).toContain("<svg")

    rerender(<ResumePreview sections={[{ typeName: "Work", typeId: "1", items: [] }]} profile={{ name: "Test" }} />)

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    expect(container.innerHTML).toContain("<svg")
    expect(screen.getByText("Preview update failed")).toBeInTheDocument()
    expect(screen.getByText("0: update error")).toBeInTheDocument()
  })
})

