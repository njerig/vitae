export type CanonItemType = "work" | "education" | "project" | "skill" | "link" | string

export type WorkContent = {
  org?: string
  role?: string
  start?: string // "YYYY-MM-DD" if you used <input type="date" />
  end?: string | null
  bullets?: string[]
  skills?: string[]
}

export type CanonItem<TContent = unknown> = {
  id: string
  user_id: string
  item_type: CanonItemType
  title: string | null
  position: number | null
  content: TContent
  created_at: string
  updated_at: string
}
