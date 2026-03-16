/**
 * UI tests for the "View Tailoring Options" story.
 *
 * Scope:
 * - Scenario 1: user can open AI Tailoring Studio and view all tweak sliders.
 * - Scenario 2: user can understand tweak ranges via low/high labels and live descriptor text.
 *
 * Out of scope:
 * - saving context, running prioritization, and applying AI-generated rewrites.
 */
import { render, screen, fireEvent } from "@testing-library/react"
import type { ComponentProps } from "react"
import { TailoringStudioCard } from "@/lib/resume-builder/tailor/components/ai/TailoringStudioCard"

type TailoringStudioProps = ComponentProps<typeof TailoringStudioCard>

/**
 * Renders the studio as a controlled component so tests can simulate
 * collapse/expand behavior from user clicks.
 */
function renderControlledStudio(overrides: Partial<TailoringStudioProps> = {}) {
  let expanded = false

  const onExpandedChange = jest.fn((next: boolean) => {
    expanded = next
  })

  const baseProps: TailoringStudioProps = {
    expanded,
    onExpandedChange,
  }

  const view = render(<TailoringStudioCard {...baseProps} {...overrides} />)

  const rerenderWithCurrentState = () =>
    view.rerender(<TailoringStudioCard {...baseProps} {...overrides} expanded={expanded} />)

  return { ...view, onExpandedChange, rerenderWithCurrentState }
}

describe("Tailoring studio view flow", () => {
  // Scenario 1: user can expand the studio and view available tweak controls.
  it("opens AI Tailoring Studio and shows all tailoring sliders", () => {
    const { onExpandedChange, rerenderWithCurrentState } = renderControlledStudio()

    fireEvent.click(screen.getByRole("button", { name: /ai tailoring studio/i }))
    expect(onExpandedChange).toHaveBeenCalledWith(true)

    rerenderWithCurrentState()

    // Four sliders represent the tweak-option space.
    expect(screen.getByText("Domain Focus")).toBeInTheDocument()
    expect(screen.getByText("Role Framing")).toBeInTheDocument()
    expect(screen.getByText("Technical Depth")).toBeInTheDocument()
    expect(screen.getByText("Detail Level")).toBeInTheDocument()
    expect(screen.getAllByRole("slider")).toHaveLength(4)
  })

  // Scenario 2: user can understand each tweak axis from range labels + descriptor.
  it("displays range labels and updates descriptor when a slider changes", () => {
    render(
      <TailoringStudioCard
        expanded
        onExpandedChange={jest.fn()}
      />
    )

    // Low/high labels communicate each axis range.
    expect(screen.getByText("Generalist")).toBeInTheDocument()
    expect(screen.getByText("Domain-specific")).toBeInTheDocument()

    const [domainSlider] = screen.getAllByRole("slider")
    fireEvent.change(domainSlider, { target: { value: "1" } })

    // Descriptor should reflect the updated slider position.
    expect(screen.getByText("Strongly domain-specific")).toBeInTheDocument()
  })
})
