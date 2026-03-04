export type ResumeTemplate = {
  id: string
  name: string
  description: string
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  { id: "classic", name: "Jake's Resume", description: "The classic single-column resume" },
  { id: "modern", name: "Modern", description: "Bold accent colour with blue name styling" },
  { id: "two-col", name: "Two Column", description: "Two-column layout with green sidebar" },
  { id: "highlight", name: "Highlight", description: "Refined single-column serif layout" },
  { id: "gradient", name: "Gradient", description: "Rainbow gradient background" }
]
