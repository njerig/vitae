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

#let profile_links(content) = {
  align(left)[#content]
}

#let profile_header(
  name: "User",
  links: (),
  contact: "",
) = {
  [= #name]
  if links.len() > 0 [
    #let joined = links.map(l => {
      let text = l.at("text", default: "")
      if text == "" { [] }
      else {
        let href = l.at("href", default: none)
        if href == none { [#text] } else { link(href)[#text] }
      }
    }).join([ | ])
    #profile_links(joined)
  ] else if contact != "" [
    #profile_links(contact)
  ]
}

#let render_sections(sections, linear_renderer) = {
  linear_renderer(sections)
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
  for it in rows {
    let label = it.at(0, default: "")
    let values = it.at(1, default: ())
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
