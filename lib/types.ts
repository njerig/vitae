// lib/types.ts
// Shared TypeScript types for Vitae

// General Item type used to create new item types
export type ItemType = {
  id: string // UUID
  user_id: string
  display_name: string
  created_at: string
}

// ─────────────────────────────────────────────────────────────
// Content Schemas (per item type)
// ─────────────────────────────────────────────────────────────

export type WorkContent = {
  org?: string
  role?: string
  start?: string // "YYYY-MM-DD"
  end?: string | null
  bullets?: string[]
  skills?: string[]
}

export type EducationContent = {
  institution?: string
  degree?: string
  field?: string
  start?: string
  end?: string | null
  gpa?: string
  bullets?: string[]
}

export type ProjectContent = {
  description?: string
  url?: string
  start?: string
  end?: string | null
  bullets?: string[]
  skills?: string[]
}

export type SkillContent = {
  category?: string
  skills?: string[]
}

export type LinkContent = {
  url: string
  label?: string
}

// ─────────────────────────────────────────────────────────────
// Canon Items
// ─────────────────────────────────────────────────────────────

export type CanonItem<TContent = unknown> = {
  id: string // UUID
  user_id: string
  item_type_id: string // UUID referencing item_types
  title: string
  position: number
  content: TContent // flexibile type to handle different item_types
  created_at: string
  updated_at: string
}
