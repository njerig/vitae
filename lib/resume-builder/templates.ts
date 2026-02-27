export type ResumeTemplate = {
  id: string
  name: string
  description: string
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  { id: "classic", name: "Jake's Resume", description: "The current resume template" },
  { id: "modern", name: "Jake's Resume 2", description: "Sans-serif variant for testing" },
  { id: "minimal", name: "WIP", description: "Coming soon" },
  { id: "compact", name: "WIP", description: "Coming soon" },
  { id: "executive", name: "WIP", description: "Coming soon" },
]

