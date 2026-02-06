// lib/canon/fields.ts
// Field configuration registry for dynamic form rendering

export type FieldType = "text" | "date" | "textarea" | "tags"

export type FieldConfig = {
  name: string // key in content object
  label: string // UI label
  type: FieldType
  required?: boolean
  placeholder?: string
}

// Field configurations for each known item type
export const ITEM_TYPE_FIELDS: Record<string, FieldConfig[]> = {
  "Work Experience": [
    { name: "org", label: "Company", type: "text", required: true, placeholder: "Google, Microsoft, etc." },
    { name: "role", label: "Position", type: "text", required: true, placeholder: "Software Engineer, PM, etc." },
    { name: "start", label: "Start Date", type: "date", required: true },
    { name: "end", label: "End Date", type: "date" },
    { name: "bullets", label: "Bullets", type: "textarea", required: true, placeholder: "One bullet per line\nBuilt X\nImproved Y" },
    { name: "skills", label: "Skills", type: "tags", placeholder: "JavaScript, React, Node.js" },
  ],
  "Education": [
    { name: "institution", label: "Institution", type: "text", required: true, placeholder: "UC Santa Cruz" },
    { name: "degree", label: "Degree", type: "text", placeholder: "Bachelor of Science" },
    { name: "field", label: "Field of Study", type: "text", placeholder: "Computer Science" },
    { name: "start", label: "Start Date", type: "date" },
    { name: "end", label: "End Date", type: "date" },
    { name: "gpa", label: "GPA", type: "text", placeholder: "3.8" },
    { name: "bullets", label: "Details", type: "textarea", placeholder: "Relevant coursework, honors, etc." },
  ],
  "Project": [
    { name: "title", label: "Project Name", type: "text", required: true, placeholder: "My Awesome Project" },
    { name: "description", label: "Description", type: "text", placeholder: "A brief description" },
    { name: "url", label: "URL", type: "text", placeholder: "https://github.com/..." },
    { name: "start", label: "Start Date", type: "date" },
    { name: "end", label: "End Date", type: "date" },
    { name: "bullets", label: "Details", type: "textarea", placeholder: "Key features, technologies used" },
    { name: "skills", label: "Skills", type: "tags", placeholder: "React, TypeScript, AWS" },
  ],
  "Skill": [
    { name: "category", label: "Category", type: "text", required: true, placeholder: "Languages, Frameworks, Tools" },
    { name: "skills", label: "Skills", type: "tags", required: true, placeholder: "JavaScript, Python, Go" },
  ],
  "Link": [
    { name: "label", label: "Label", type: "text", required: true, placeholder: "LinkedIn, GitHub, Portfolio" },
    { name: "url", label: "URL", type: "text", required: true, placeholder: "https://linkedin.com/in/..." },
  ],
}

// Fallback fields for custom/unknown item types
export const GENERIC_FIELDS: FieldConfig[] = [
  { name: "title", label: "Title", type: "text", required: true, placeholder: "Item title" },
  { name: "start", label: "Start Date", type: "date" },
  { name: "end", label: "End Date", type: "date" },
  { name: "bullets", label: "Details", type: "textarea", placeholder: "One item per line" },
]

// Get fields for an item type (falls back to generic)
export function getFieldsForType(displayName: string): FieldConfig[] {
  return ITEM_TYPE_FIELDS[displayName] || GENERIC_FIELDS
}

// Get the primary title field for an item type (for display in list)
export function getTitleField(displayName: string): string {
  const fields = ITEM_TYPE_FIELDS[displayName]
  if (!fields) return "title"
  
  // Map type to its "title" field
  const titleMap: Record<string, string> = {
    "Work Experience": "role",
    "Education": "institution",
    "Project": "title",
    "Skill": "category",
    "Link": "label",
  }
  return titleMap[displayName] || "title"
}

// Get the subtitle field for an item type (for display in list)
export function getSubtitleField(displayName: string): string | null {
  const subtitleMap: Record<string, string> = {
    "Work Experience": "org",
    "Education": "degree",
    "Project": "description",
  }
  return subtitleMap[displayName] || null
}
