/**
 * Preview behavior tests for the resume builder.
 *
 * These tests intentionally mirror the user-story flow:
 * 1) initial loading + first render,
 * 2) live updates after edits,
 * 3) failure handling,
 * 4) recovery,
 * 5) stale response protection.
 */
import { render, screen, act } from "@testing-library/react"
import { ResumeBuilderPreview } from "@/lib/resume-builder/components/ResumePreview"

/**
 * Flushes queued promise callbacks so React state updates from async work settle.
 * We use two turns because the preview hook does chained async operations.
 */
async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
}

/**
 * Creates a controllable promise for race-condition tests.
 * Useful when we need to resolve requests out of order (slow vs fast).
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

describe("ResumeBuilderPreview", () => {
  beforeEach(() => {
    jest.useFakeTimers()
      ; (global.fetch as unknown) = jest.fn()
    jest.spyOn(console, "error").mockImplementation(() => { })
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.resetAllMocks()
  })

  // Scenario 1: shows loading state on initial preview
  it("shows loading state on initial preview", () => {
    render(<ResumeBuilderPreview sections={[]} profile={{ name: "Test" }} />)

    expect(screen.getByText("Generating preview...")).toBeInTheDocument()
  })

  // Scenario 2: renders initial preview successfully
  it("renders initial preview successfully", async () => {
    ; (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => "<svg><text>initial</text></svg>",
    })

    const { container } = render(<ResumeBuilderPreview sections={[]} profile={{ name: "Test" }} />)

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    expect(container.innerHTML).toContain("initial")
    expect(screen.queryByText("Generating preview...")).not.toBeInTheDocument()
  })

  // Scenario 3: Live preview updates as resume content changes
  it("updates preview after resume edits", async () => {
    ; (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg><text>v1</text></svg>",
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg><text>v2</text></svg>",
      })

    const { container, rerender } = render(
      <ResumeBuilderPreview sections={[]} profile={{ name: "Test" }} />
    )

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })
    expect(container.innerHTML).toContain("v1")

    rerender(
      <ResumeBuilderPreview
        sections={[{ typeName: "Work", typeId: "1", items: [{ id: "item-1" }] as any[] }]}
        profile={{ name: "Test" }}
      />
    )

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })
    expect(container.innerHTML).toContain("v2")
  })

  // Scenario 4: Initial compile failure should block with a clear error
  it("shows blocking error when initial preview compilation fails", async () => {
    ; (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "0: bad typst" }),
    })

    render(<ResumeBuilderPreview sections={[]} profile={{ name: "Test" }} />)

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    expect(screen.getByText("Preview failed")).toBeInTheDocument()
    expect(screen.getByText("0: bad typst")).toBeInTheDocument()
  })

  // Scenario 5: Update failures are non-blocking
  it("keeps last preview and shows non-blocking error when update fails", async () => {
    ; (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        text: async () => "<svg><text>ok</text></svg>",
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "0: update error" }),
      })

    const { container, rerender } = render(
      <ResumeBuilderPreview sections={[]} profile={{ name: "Test" }} />
    )

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    expect(container.innerHTML).toContain("<svg")

    rerender(
      <ResumeBuilderPreview
        sections={[{ typeName: "Work", typeId: "1", items: [] }]}
        profile={{ name: "Test" }}
      />
    )

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    expect(container.innerHTML).toContain("<svg")
    expect(screen.getByText("Preview update failed")).toBeInTheDocument()
    expect(screen.getByText("0: update error")).toBeInTheDocument()
  })

  // Scenario 6: Recover after update failure on next successful update
  it("recovers after update failure on next successful update", async () => {
    ; (global.fetch as jest.Mock)
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

    const { container, rerender } = render(
      <ResumeBuilderPreview sections={[]} profile={{ name: "Test" }} />
    )

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    rerender(
      <ResumeBuilderPreview
        sections={[{ typeName: "Work", typeId: "1", items: [] }]}
        profile={{ name: "Test" }}
      />
    )

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })
    expect(screen.getByText("Preview update failed")).toBeInTheDocument()

    rerender(
      <ResumeBuilderPreview
        sections={[{ typeName: "Work", typeId: "1", items: [{ id: 1 }] as any[] }]}
        profile={{ name: "Test" }}
      />
    )

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    expect(screen.queryByText("Preview update failed")).not.toBeInTheDocument()
    expect(container.innerHTML).toContain("v2")
  })

  // Scenario 7: Latest request wins even if older requests resolve later
  it("ignores stale responses and keeps the newest preview", async () => {
    const slow = deferred<{ ok: boolean; text: () => Promise<string> }>()
    const fast = deferred<{ ok: boolean; text: () => Promise<string> }>()

      ; (global.fetch as jest.Mock)
        .mockImplementationOnce(() => slow.promise)
        .mockImplementationOnce(() => fast.promise)

    const { container, rerender } = render(
      <ResumeBuilderPreview sections={[]} profile={{ name: "Test" }} />
    )

    await act(async () => {
      jest.advanceTimersByTime(500)
      await flushMicrotasks()
    })

    rerender(
      <ResumeBuilderPreview
        sections={[{ typeName: "Work", typeId: "1", items: [] }]}
        profile={{ name: "Test" }}
      />
    )

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
