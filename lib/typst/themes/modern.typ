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

// -- Helpers ----------------------------------------------------------------
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

#let profile_links(content) = {
  align(center)[#content]
}

// -- Component functions ------------------------------------------------------
#let date_pattern = "[month repr:short]. [year]"

#let fmt_date(d) = {
  if d == none { "" } else { d.display(date_pattern) }
}

#let date_range(dates) = {
  let s = fmt_date(dates.start)
  let e = fmt_date(dates.end)
  if s == "" { "" } else { s + " " + sym.dash.en + " " + (if e != "" { e } else { "Present" }) }
}

#let school(
  institution: "",
  location: "",
  dates: (start: none, end: none),
  degree: "",
  GPA: "",
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
    ..(if GPA != "" { ([GPA: #GPA],) } else { () }),
    ..bullets.map(b => [#b]),
  )
}

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

#let skills(items: ()) = {
  let rows = items.filter(it => it.at(0, default: "") != "" and it.at(1, default: ()).len() > 0)
  let cells = rows.map(it => (
    [#strong(it.at(0, default: ""))],
    [#it.at(1, default: ()).join(", ")],
  )).flatten()
  if cells.len() > 0 {
    table(columns: (auto, 1fr), align: (right, left),stroke: none, ..cells)
  }
}
