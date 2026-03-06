export const COLORS = {
  added: { bg: "#fdf6f0", border: "#d4a574", text: "#7c3d12", badge: "#fde8d0" },
  removed: { bg: "#fdf0f0", border: "#c9a0a0", text: "#7c1212", badge: "#fad8d8" },
  unchanged: {
    bg: "var(--surface, #faf9f7)",
    border: "var(--grid)",
    text: "var(--ink)",
    badge: "#f0ede8",
  },
}

export const FIELD_LABELS: Record<string, string> = {
  title: "Title",
  org: "Organization",
  role: "Role",
  start: "Start Date",
  end: "End Date",
  bullets: "Bullets",
  skills: "Skills",
  institution: "Institution",
  degree: "Degree",
  field: "Field of Study",
  gpa: "GPA",
  description: "Description",
  url: "URL",
  label: "Label",
  category: "Category",
}
