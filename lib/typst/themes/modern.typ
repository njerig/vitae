// -- Page setup ---------------------------------------------------------------
#set page(margin: (
  left: 0.5in,
  right: 0.5in,
  top: 0.5in,
  bottom: 0.5in,
))
#set text(font: "Figtree")
#set list(tight: true)

// -- Theme parameters ---------------------------------------------------------
#let sizes = (
  body: 11pt,
  section: 13pt,
  name: 24pt,
)
#let margins = (
  section-line: (top: 1.5em, bottom: 0.85em),
  section: (top: 2em, bottom: 0.5em),
  list: (top: 0.8em)
)

#let colors = (
  accent: rgb("#123499"),
)

// -- Helpers ------------------------------------------------------------------
#let plain-text(c) = {
  if type(c) == str { c }
  else if c == [] { " " }
  else if c.has("children") { c.children.map(plain-text).join("") }
  else if c.has("body") { plain-text(c.body) }
  else if c.has("text") {
    if type(c.text) == str { c.text } else { plain-text(c.text) }
  }
  else { "" }
}

// -- Show rules ---------------------------------------------------------------
#show heading.where(level: 1): it => {
  let parts = plain-text(it).split()
  let rest = if parts.len() > 1 {
    parts.slice(0, parts.len() - 1).join(" ")
  } else {
    ""
  }
  let last = parts.last(default: "")
  align(center)[
    #text(size: sizes.name, weight: "regular", fill: colors.accent)[#rest]
    #if rest != "" { h(0.18em) }
    #text(size: sizes.name, weight: "bold")[#last]
  ]
}

#show heading.where(level: 2): set block(above: margins.section.top, below: margins.section.bottom)

#show heading.where(level: 2): it => {
  block(
    above: margins.section-line.top,
    below: margins.section-line.bottom,
  )[
    #grid(
      columns: (auto, 1fr),
      gutter: 0.5em,
      align: (left + horizon, center + horizon),
      [#text(size: sizes.section, weight: "bold", fill: colors.accent)[#it]],
      [#line(length: 100%, stroke: 0.5pt + colors.accent)]
    )
  ]
}

#show link: it => {
  underline(offset: 3pt)[#it]
}

#show list: set block(above: margins.list.top)

// -- Date formatting ----------------------------------------------------------
#let date_pattern = "[month repr:short]. [year]"

#let fmt_date(d) = {
  if d == none { "" } else { d.display(date_pattern) }
}

#let date_range(dates) = {
  let s = fmt_date(dates.start)
  let e = fmt_date(dates.end)
  if s == "" { "" } else { s + " " + sym.dash.en + " " + (if e != "" { e } else { "Present" }) }
}

// -- Component functions ------------------------------------------------------

/// Formats a list of links as a single block.
/// - links (list): the list of links to format
/// -> block
#let profile_links(links) = {
  let joined = links.map(l => {
    let text = l.at("text", default: "")
    if text == "" { [] }
    else {
      let href = l.at("href", default: none)
      if href == none { [#text] } else { link(href)[#text] }
    }
  }).join([ | ])
  align(center)[#joined]
}

/// Formats a profile header as a single block.
/// - name (str): the name of the profile
/// - links (list): the list of links to format
/// -> block
#let profile-header(
  name: "User",
  links: (),
) = {
  [= #name]
  if links.len() > 0 [
    #profile_links(links)
  ]
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
  grid(
    columns: (1fr, auto), gutter: 8pt, align: (left, right),
    [#strong(institution)],
    [#strong(location)],
    [#degree],
    [#date_range(dates)],
  )
  list(
    ..(if gpa != "" { ([GPA: #gpa],) } else { () }),
    ..bullets.map(b => [#b]),
  )
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
  grid(
    columns: (1fr, auto), gutter: 8pt, align: (left, right),
    [#strong(position)],
    [#strong(location)],
    [#organization],
    [#date_range(dates)],
  )
  list(
    ..bullets.map(b => [#b]),
    ..(if skills.len() > 0 { ([Skills: #skills.join(", ")],) } else { () }),
  )
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
    [#strong(name) | #if skills.len() > 0 { skills.join(", ") }],
    [#date_range(dates)],
  )
  list(..bullets.map(b => [#b]))
}

/// Formats a skills entry as a single block.
/// - items (list): the list of skills to format
/// -> block
#let skills(items: ()) = {
  let rows = items.filter(it => it.at("label", default: "") != "" and it.at("values", default: ()).len() > 0)
  let cells = rows.map(it => (
    [#strong(it.at("label", default: ""))],
    [#it.at("values", default: ()).join(", ")],
  )).flatten()
  if cells.len() > 0 {
    table(columns: (auto, 1fr), align: (right, left), stroke: none, ..cells)
  }
}

/// Renders the resume. Layout and which entry kinds are supported are theme-defined 
/// (add more `kind` branches for custom sections).
#let render-resume(profile, sections) = {
  profile-header(
    name: profile.at("name", default: "User"),
    links: profile.at("links", default: ()),
  )
  for section in sections [
    #let title = section.at("title", default: "")
    #let entries = section.at("entries", default: ())
    #if title != "" and entries.len() > 0 [
      == #title
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
    ]
  ]
}