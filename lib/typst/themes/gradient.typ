// -- Page setup ---------------------------------------------------------------
#let sizes = (
  body: 11pt,
  section: 15pt,
  name: 36pt,
  margins: (
    page: (
      left: 0.5in,
      right: 0.5in,
      top: 0.5in,
      bottom: 0.5in,
    ),
    section-line: (top: 0.5em, bottom: 0.75em),
    section: (top: 2em, bottom: 0.5em),
    list: (top: 0.8em),
  )
)

#set page(
  margin: sizes.margins.page,
  fill: gradient.linear(
    rgb(247, 239, 232),
    rgb(238, 246, 242),
    angle: 120deg,
  ),
  background: {
    // Pink glow (top-left)
    place(top + left)[
      #rect(
        width: 100%,
        height: 100%,
        stroke: none,
        fill: gradient.radial(
          rgb(242, 178, 214, 210),
          rgb(242, 178, 214, 0),
          center: (12%, 12%),
          radius: 52%,
          relative: "parent",
        ),
      )
    ]

    // Warm yellow glow (top-right)
    place(top + left)[
      #rect(
        width: 100%,
        height: 100%,
        stroke: none,
        fill: gradient.radial(
          rgb(239, 230, 184, 170),
          rgb(239, 230, 184, 0),
          center: (88%, 10%),
          radius: 48%,
          relative: "parent",
        ),
      )
    ]

    // Mint/cyan glow (bottom-right)
    place(top + left)[
      #rect(
        width: 100%,
        height: 100%,
        stroke: none,
        fill: gradient.radial(
          rgb(174, 233, 223, 200),
          rgb(174, 233, 223, 0),
          center: (86%, 88%),
          radius: 58%,
          relative: "parent",
        ),
      )
    ]
  },
)

#set text(font: "Inter 24pt")
#set list(tight: true)

// -- Show rules ---------------------------------------------------------------
#show heading.where(level: 1): it => {
  text(size: sizes.name, weight: "bold")[#it]
}

#show heading.where(level: 2): set block(above: sizes.margins.section.top, below: sizes.margins.section.bottom)

#show heading.where(level: 2): it => {
  block(below: 0.95em)[
    #text(size: sizes.section, weight: "bold")[#sym.plus #it.body]
  ]
}

#show link: it => {
  underline(offset: 3pt)[#it]
}

#show list: set block(above: sizes.margins.list.top)

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
/// - content (str): the content to format
/// -> block
#let profile_links(content) = {
  align(end)[#content]
}

/// Formats a profile header as a single block.
/// - name (str): the name of the profile
/// - links (list): the list of links to format
/// -> block
#let profile-header(
  name: "User",
  links: (),
) = {
  let right_rows = if links.len() > 0 {
    links.map(l => {
      let text = l.at("text", default: "")
      if text == "" { [] }
      else {
        let href = l.at("href", default: none)
        if href == none { [#text] } else { link(href)[#text] }
      }
    })
  } else {()}
  let row_count = if right_rows.len() > 0 { right_rows.len() } else { 1 }
  grid(
    columns: (1fr, auto),
    gutter: 0.5em,
    grid.cell(rowspan: row_count)[
      = #name
    ],
    ..right_rows.map(row => [#profile_links(row)])
  )
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
    [#location],
    [#emph(degree)],
    [#emph(date_range(dates))],
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
    [#date_range(dates)],
    [#emph(organization)],
    [#emph(location)],
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
    [#strong(name) | #if skills.len() > 0 { emph(skills.join(", ")) }],
    [#emph(date_range(dates))],
  )
  list(..bullets.map(b => [#b]))
}

/// Formats a skills entry as a single block.
/// - items (list): the list of skills to format
/// -> block
#let skills(items: ()) = {
  for it in items {
    let label = it.at("label", default: "")
    let values = it.at("values", default: ())
    if label != "" and values.len() > 0 {
      list([#strong(label): #values.join(", ")])
    }
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