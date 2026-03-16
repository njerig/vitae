/**
 * Integration-like component tests for the "View Templates" user story.
 *
 * Scope:
 * - Scenario 1: user can open the template picker
 * - Scenario 2: user can see multiple preset templates with names and previews
 *
 * Out of scope for this file:
 * - selecting/applying a template
 */
import { render, screen, fireEvent } from "@testing-library/react"
import { TemplateSelectorButton } from "@/lib/resume-builder/components/TemplateSelectorButton"
import { RESUME_TEMPLATES } from "@/lib/resume-builder/templates"

/**
 * Opens the template picker from its trigger button.
 */
function openTemplatePicker() {
  fireEvent.click(screen.getByRole("button", { name: /jake's resume/i }))
}

describe("Template view flow", () => {
  // Shared setup: start from the default template trigger.
  function renderTemplateButton() {
    render(<TemplateSelectorButton selectedTemplateId="classic" onSelect={jest.fn()} />)
  }

  // Scenario 1: user can open the template gallery/picker.
  it("opens the template picker from the selector button", () => {
    renderTemplateButton()

    openTemplatePicker()

    expect(screen.getByText(/choose a template/i)).toBeInTheDocument()
  })

  // Scenario 2: user can view multiple presets with names and preview cards.
  it("displays multiple preset templates with names and previews", () => {
    renderTemplateButton()

    openTemplatePicker()

    // Story expectation: there are multiple template options.
    expect(RESUME_TEMPLATES.length).toBeGreaterThan(1)

    for (const template of RESUME_TEMPLATES) {
      // Each template appears with its visible name.
      expect(screen.getAllByText(template.name).length).toBeGreaterThan(0)
      // Each template card exposes preview metadata via title/description.
      expect(screen.getByTitle(template.description)).toBeInTheDocument()
    }
  })
})
