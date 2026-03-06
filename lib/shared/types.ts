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

// A canon item that has been soft-deleted and moved to the archive.
// Identical to CanonItem but carries a deleted_at timestamp.
// These are returned by the restore route so old version previews
// can still render items that the user has since deleted.
export type ArchivedCanonItem<TContent = unknown> = CanonItem<TContent> & {
  deleted_at: string
}

// ─────────────────────────────────────────────────────────────
// Versions
// ─────────────────────────────────────────────────────────────

export type Version = {
  id: string
  user_id: string
  resume_group_id: string
  parent_version_id: string | null
  group_name: string
  name: string
  snapshot: Record<string, unknown>
  created_at: string
}

export type VersionGroup = {
  resume_group_id: string
  group_name: string
  versions: Version[]
}
