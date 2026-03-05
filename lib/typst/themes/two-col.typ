// -- Page setup ---------------------------------------------------------------
#set page(
  columns: 2,
  margin: (
    left: 0.35in,
    right: 0.35in,
    top: 0.35in,
    bottom: 0.35in,
  ),
  background: {
    place(top + left, dx: 0pt, dy: 0pt)[
      #rect(
        width: 50%,
        height: 100%,
        fill: rgb("#eaf6ea"),
        stroke: none
      )
    ]
  }
)
#set columns(gutter: 10%)
#set text(font: "Fira Sans")
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
  accent-bg: rgb("#eaf6ea"),
  accent-fg: rgb("#06402b")
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
  text(size: sizes.name, weight: "bold")[#it]
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
      [#text(size: sizes.section, weight: "bold", fill: colors.accent-fg)[#it]],
      [#line(length: 100%, stroke: 0.5pt + colors.accent-fg)]
    )
  ]
}

#show list: set block(above: margins.list.top)

#show link: it => {
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
  align(left)[#joined]
}

/// Formats a profile header as a single block.
/// - name (str): the name of the profile
/// - links (list): the list of links to format
/// -> block
#let profile-header(
  name: "User",
  links: (),
  contact: "",
) = {
  [= #name]
  if links.len() > 0 [
    #profile_links(links)
  ] else if contact != "" [
    #align(left)[#contact]
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
  for it in rows {
    let label = it.at("label", default: "")
    let values = it.at("values", default: ())
    [#strong(label):]
    [
      #values.map(v => box(
        inset: (x: 0.35em, y: 0.15em),
        radius: 0.25em,
        fill: luma(96%),
        stroke: 0.4pt + luma(80%),
      )[#v]).join([ ]) \ 
    ]
  }
}

/// Formats a resume in a top-to-bottom layout.
/// - profile (dict): the profile to format
/// - sections (list): the sections to format
/// -> block
#let render-resume(profile, sections) = render-resume-linear(profile, sections)
