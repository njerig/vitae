// -- Page setup ---------------------------------------------------------------
#set page(margin: (
  left: 0.5in,
  right: 0.5in,
  top: 0.5in,
  bottom: 0.5in,
))

// -- Theme parameters ---------------------------------------------------------
#let sizes = (
  body: 12pt,
  section: 13pt,
  name: 24pt,
  section-gap: 1.5em,
  item-body-gap: 0.85em,
)

#let colors = (
  header-bg: rgb("#5b3a29"),
  header-fg: rgb("#f8f3ed"),
  header-rule: rgb("#d8c7b9"),
  section-col-bg: rgb("#eadfcd"),
)

#set text(font: "Crimson Pro", size: sizes.body)

// -- Show rules ---------------------------------------------------------------
#show heading.where(level: 1): it => {
  align(center)[
    #text(size: sizes.name, weight: "bold")[#it]
  ]
}

#show heading.where(level: 2): set block(above: sizes.section-gap, below: 0.5em)

#show heading.where(level: 2): it => {
  smallcaps[#text(size: sizes.section)[#it]]
}

#show link: it => {
  set text(fill: colors.header-bg)
  underline(offset: 3pt)[#it]
}

// -- Date formatting ----------------------------------------------------------
/// example: "Jan. 2025"
#let date_pattern = "[month repr:short]. [year]"

/// A helper to format a date as a string.
/// - d (datetime | none): the date to format
/// -> str
#let fmt_date(d) = {
  if d == none { "" } else { d.display(date_pattern) }
}

/// A helper to format a date range as a string.
/// - dates (dict): the date range to format
/// -> str
#let date_range(dates) = {
  let s = fmt_date(dates.start)
  let e = fmt_date(dates.end)
  if s == "" { "" } else { s + sym.dash.en + (if e != "" { e } else { "Present" }) }
}

// -- Component functions ------------------------------------------------------

/// Formats a list of links as a single block.
/// - links (list): the list of links to format
/// -> block
#let profile_links(links) = {
  links.map(l => {
    let text = l.at("text", default: "")
    if text == "" { [] }
    else {
      let href = l.at("href", default: none)
      if href == none { [#text] } else { link(href)[#text] }
    }
  }).join(linebreak())
}

/// Formats a profile header as a single block.
/// - name (str): the name of the profile
/// - links (list): the list of links to format
/// -> block
#let profile-header(
  name: "User",
  links: (),
) = {
  let parts = name.split(regex("\\s*,\\s*"))
  let primary = parts.at(0, default: name)
  let suffix = if parts.len() > 1 { parts.slice(1).join(", ") } else { "" }

  let right_content = if links.len() > 0 [
    #profile_links(links)
  ] else []

  block(below: 1em)[
    #grid(
      columns: (1fr, auto),
      gutter: 1em,
      align: (left + bottom, right + bottom),
      [
        #block(fill: colors.section-col-bg, inset: (x: 0.45em, y: 0.2em))[#text(size: 22pt, weight: "bold")[#primary]]
        #if suffix != "" [
          #h(0.65em)
          #text(size: 13pt)[#suffix]
        ]
      ],
      [
        #align(end)[#right_content]
      ],
    )
  ]
  line(length: 100%, stroke: 0.5pt + black)
}

/// Formats a school entry as a single block.
/// - institution (str): the name of the institution
/// - location (str): the location of the institution
/// - dates (dict): the date range of the institution
/// - degree (str): the degree of the institution
/// - gpa (str): the GPA of the institution
/// - bullets (list): the list of bullets to format
/// -> block
#let school(
  institution: "",
  location: "",
  dates: (start: none, end: none),
  degree: "",
  gpa: "",
  bullets: (),
) = {
  let has_body = gpa != "" or bullets.len() > 0
  grid(
    columns: (1fr, auto), gutter: 8pt, align: (left, right),
    [#strong(institution)],
    [#location],
    [#emph(degree)],
    [#emph(date_range(dates))],
  )
  if has_body {
    block(above: sizes.item-body-gap)[
      #if gpa != "" [
        GPA: #gpa
      ]
      #if bullets.len() > 0 [
        #list(..bullets.map(b => [#b]))
      ]
    ]
  }
}

/// Formats a work entry as a single block.
/// - organization (str): the name of the organization
/// - location (str): the location of the organization
/// - dates (dict): the date range of the organization
/// - position (str): the position of the organization
/// - skills (list): the list of skills to format
/// - bullets (list): the list of bullets to format
/// -> block
#let work(
  organization: "",
  location: "",
  dates: (start: none, end: none),
  position: "",
  skills: (),
  bullets: (),
) = {
  let has_body = bullets.len() > 0 or skills.len() > 0
  grid(
    columns: (1fr, auto), gutter: 8pt, align: (left, right),
    [#strong(position)],
    [#date_range(dates)],
    [#emph(organization)],
    [#emph(location)],
  )
  if has_body {
    block(above: sizes.item-body-gap)[
      #if bullets.len() > 0 [
        #list(..bullets.map(b => [#b]))
      ]
      #if skills.len() > 0 [
        Skills: #skills.join(", ")
      ]
    ]
  }
}

/// Formats a project entry as a single block.
/// - name (str): the name of the project
/// - dates (dict): the date range of the project
/// - skills (list): the list of skills to format
/// - bullets (list): the list of bullets to format
/// -> block
#let project(
  name: "",
  dates: (start: none, end: none),
  skills: (),
  bullets: (),
) = {
  grid(
    columns: (1fr, auto), gutter: 8pt, align: (left, right),
    [#strong(name) | #if skills.len() > 0 { emph(skills.join(", ")) }],
    [#emph(date_range(dates))],
  )
  if bullets.len() > 0 {
    block(above: sizes.item-body-gap)[
      #list(..bullets.map(b => [#b]))
    ]
  }
}

/// Formats a skills entry as a single block.
/// - items (list): the list of skills to format
/// -> block
#let skills(items: ()) = {
  let lines = items.map(it => {
    let label = it.at("label", default: "")
    let values = it.at("values", default: ())
    if label == "" or values.len() == 0 { [] }
    else { [#strong(label): #values.join(", ")] }
  })
  list(..lines)
}

/// Formats a resume in a two-column layout.
/// - profile (dict): the profile to format
/// - sections (list): the sections to format
/// -> block
#let render-resume(profile, sections) = {
  profile-header(
    name: profile.at("name", default: "User"),
    links: profile.at("links", default: ()),
  )

  let rows = sections.filter(sec => {
    let title = sec.at("title", default: "")
    let entries = sec.at("entries", default: ())
    title != "" and entries.len() > 0
  })

  let cells = rows.map(sec => {
    let title = sec.at("title", default: "")
    let entries = sec.at("entries", default: ())
    (
      [#block(fill: colors.section-col-bg, inset: (x: 0.45em, y: 0.2em))[#strong(title)]],
      [
        #for entry in entries [
          #let kind = entry.at("kind", default: "")
          #if kind == "school" [
            #school(
              institution: entry.at("institution", default: ""),
              location: entry.at("location", default: ""),
              dates: entry.at("dates", default: (start: none, end: none)),
              degree: entry.at("degree", default: ""),
              gpa: entry.at("gpa", default: ""),
              bullets: entry.at("bullets", default: ()),
            )
          ] else if kind == "work" [
            #work(
              position: entry.at("position", default: ""),
              organization: entry.at("organization", default: ""),
              location: entry.at("location", default: ""),
              dates: entry.at("dates", default: (start: none, end: none)),
              skills: entry.at("skills", default: ()),
              bullets: entry.at("bullets", default: ()),
            )
          ] else if kind == "project" [
            #project(
              name: entry.at("name", default: ""),
              dates: entry.at("dates", default: (start: none, end: none)),
              skills: entry.at("skills", default: ()),
              bullets: entry.at("bullets", default: ()),
            )
          ] else if kind == "skills" [
            #skills(items: entry.at("items", default: ()))
          ]
        ]
      ],
    )
  }).flatten()

  if cells.len() > 0 {
    grid(
      columns: (auto, 1fr),
      gutter: sizes.section-gap,
      align: (left, top),
      ..cells,
    )
  }
}
