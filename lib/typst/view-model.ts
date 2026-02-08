type UnknownRecord = Record<string, unknown>

function asRecord(v: unknown): UnknownRecord | null {
  return typeof v === "object" && v !== null ? (v as UnknownRecord) : null
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : ""
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === "string" && x.trim() !== "")
}

function normalizeHref(hrefRaw: string): string | undefined {
  const href = hrefRaw.trim()
  if (
    href.length > 0 &&
    href.length <= 2048 &&
    /^(https?:\/\/|mailto:|tel:)/.test(href)
  ) {
    return href
  }
  return undefined
}

type DateParts = { year: number; month?: number }
type DateRange = { start: DateParts | null; end: DateParts | null }
type ProfileLink = { text: string; href?: string }

function parseDateParts(input: unknown): { year: number; month?: number } | null {
  const s = asString(input).trim()
  if (!s) return null

  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(s)
  if (!m) return null

  const year = Number(m[1])
  if (!Number.isFinite(year)) return null

  const monthStr = m[2]
  if (!monthStr) return { year }

  const month = Number(monthStr)
  if (!Number.isFinite(month) || month < 1 || month > 12) return { year }

  return { year, month }
}

export type ResumeViewModel = {
  profile: {
    name: string
    links: ProfileLink[]
    contact?: string
  }
  sections: Array<{
    title: string
    entries: Array<
      | {
          kind: "school"
          institution: string
          location: string
          dates: DateRange
          degree: string
          gpa: string
          bullets: string[]
        }
      | {
          kind: "work"
          organization: string
          location: string
          dates: DateRange
          position: string
          skills: string[]
          bullets: string[]
        }
      | {
          kind: "project"
          name: string
          dates: DateRange
          skills: string[]
          bullets: string[]
        }
      | {
          kind: "skills"
          items: Array<{ label: string; values: string[] }>
        }
    >
  }>
}

function normalizeProfile(input: unknown): ResumeViewModel["profile"] {
  const p = asRecord(input) ?? {}
  const links = Array.isArray(p.links)
    ? (p.links as unknown[]).flatMap((l) => {
        const r = asRecord(l)
        if (!r) return []
        const text = asString(r.text).trim()
        const href = asString(r.href)
        if (!text) return []
        return [{ text, href: normalizeHref(href) }]
      })
    : []

  const name = asString(p.name).trim()
  const contact = asString(p.contact).trim()

  return {
    name: name || "User",
    links,
    contact: contact || undefined,
  }
}

function isSkillsSection(title: string): boolean {
  return title === "Skills" || title === "Technical Skills" || title === "Skill"
}

function isLinkSection(title: string): boolean {
  return title === "Link" || title === "Links"
}

export function buildResumeViewModel(input: unknown): ResumeViewModel {
  const root = asRecord(input) ?? {}
  const baseProfile = normalizeProfile(root.profile)
  const rawSections = Array.isArray(root.sections) ? (root.sections as unknown[]) : []

  const sections: ResumeViewModel["sections"] = []
  const extractedLinks: ProfileLink[] = []

  for (const s of rawSections) {
    const sec = asRecord(s)
    if (!sec) continue

    const title = asString(sec.typeName).trim()
    const items = Array.isArray(sec.items) ? (sec.items as unknown[]) : []
    if (!title || items.length === 0) continue

    if (isLinkSection(title)) {
      for (const it of items) {
        const item = asRecord(it)
        if (!item) continue
        const itemTitle = asString(item.title).trim()
        const content = asRecord(item.content) ?? {}
        const url = asString(content.url)
        const label = asString(content.label).trim() || itemTitle
        if (!label) continue
        extractedLinks.push({ text: label, href: normalizeHref(url) })
      }
      continue
    }

    if (isSkillsSection(title)) {
      const skillItems = items.flatMap((it) => {
        const item = asRecord(it)
        if (!item) return []
        const content = asRecord(item.content) ?? {}
        const label = asString(content.category).trim()
        const values = asStringArray(content.skills)
        if (!label || values.length === 0) return []
        return [{ label, values }]
      })

      if (skillItems.length > 0) {
        sections.push({ title: "Skills", entries: [{ kind: "skills", items: skillItems }] })
      }
      continue
    }

    const entries: ResumeViewModel["sections"][number]["entries"] = []

    for (const it of items) {
      const item = asRecord(it)
      if (!item) continue

      const itemTitle = asString(item.title).trim()
      const content = asRecord(item.content) ?? {}

      if (title === "Education") {
        const institution = asString(content.institution).trim() || itemTitle
        const location = asString(content.location).trim()
        const degree = asString(content.degree).trim()
        const field = asString(content.field).trim()
        const start = parseDateParts(content.start)
        const end = parseDateParts(content.end)
        const gpa = asString(content.gpa).trim()
        const bullets = asStringArray(content.bullets)

        entries.push({
          kind: "school",
          institution,
          location,
          dates: { start, end },
          degree: degree + (degree && field ? ", " : "") + field,
          gpa,
          bullets,
        })
        continue
      }

      if (title === "Work Experience") {
        const position = asString(content.role).trim() || itemTitle
        const organization = asString(content.org).trim()
        const location = asString(content.location).trim()
        const start = parseDateParts(content.start)
        const end = parseDateParts(content.end)
        const bullets = asStringArray(content.bullets)
        const skills = asStringArray(content.skills)

        entries.push({
          kind: "work",
          organization,
          location,
          dates: { start, end },
          position,
          skills,
          bullets,
        })
        continue
      }

      if (title === "Projects" || title === "Project") {
        const start = parseDateParts(content.start)
        const end = parseDateParts(content.end)
        const bullets = asStringArray(content.bullets)
        const skills = asStringArray(content.skills)

        entries.push({
          kind: "project",
          name: itemTitle,
          dates: { start, end },
          skills,
          bullets,
        })
        continue
      }
    }

    if (entries.length > 0) {
      sections.push({ title, entries })
    }
  }

  const links = (() => {
    const all = [...baseProfile.links, ...extractedLinks]
    if (all.length === 0) return []
    const seen = new Set<string>()
    return all.filter((l) => {
      const key = `${l.text}::${l.href ?? ""}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  })()

  return { profile: { ...baseProfile, links }, sections }
}

