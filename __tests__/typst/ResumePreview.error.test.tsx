import { render, screen, act } from "@testing-library/react"
import { ResumePreview } from "@/app/resume/ResumePreview"

async function flushMicrotasks() {
  // Flush a couple microtask turns for state updates.
  await Promise.resolve()
  await Promise.resolve()
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
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

  it("clears non-blocking error banner after next successful update", async () => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg><text>v1</text></svg>",
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "0: update error" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg><text>v2</text></svg>",
      })

    const { rerender } = render(<ResumePreview sections={[]} profile={{ name: "Test" }} />)

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    rerender(<ResumePreview sections={[{ typeName: "Work", typeId: "1", items: [] }]} profile={{ name: "Test" }} />)
    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })
    expect(screen.getByText("Preview update failed")).toBeInTheDocument()

    rerender(
      <ResumePreview
        sections={[{ typeName: "Work", typeId: "1", items: [{ id: 1 }] as any[] }]}
        profile={{ name: "Test" }}
      />
    )
    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    expect(screen.queryByText("Preview update failed")).not.toBeInTheDocument()
  })

  it("ignores stale responses when a newer request finishes first", async () => {
    const slow = deferred<{ ok: boolean; text: () => Promise<string> }>()
    const fast = deferred<{ ok: boolean; text: () => Promise<string> }>()

    ;(global.fetch as jest.Mock)
      .mockImplementationOnce(() => slow.promise)
      .mockImplementationOnce(() => fast.promise)

    const { container, rerender } = render(<ResumePreview sections={[]} profile={{ name: "Test" }} />)

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    rerender(<ResumePreview sections={[{ typeName: "Work", typeId: "1", items: [] }]} profile={{ name: "Test" }} />)
    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    await act(async () => {
      fast.resolve({ ok: true, text: async () => "<svg><text>new</text></svg>" })
      await flushMicrotasks()
    })
    expect(container.innerHTML).toContain("new")

    await act(async () => {
      slow.resolve({ ok: true, text: async () => "<svg><text>old</text></svg>" })
      await flushMicrotasks()
    })

    expect(container.innerHTML).toContain("new")
    expect(container.innerHTML).not.toContain("old")
  })
})

