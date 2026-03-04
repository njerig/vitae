// -- Page setup ---------------------------------------------------------------
#set page(margin: (
  left: 0.5in,
  right: 0.5in,
  top: 0.5in,
  bottom: 0.5in,
))
#set text(font: "New Computer Modern")
#set list(tight: true)

// -- Theme parameters ---------------------------------------------------------
#let sizes = (
  body: 11pt,
  section: 13pt,
  name: 20pt,
)
#let margins = (
  section-line: (top: 0.5em, bottom: 0.75em),
  section: (top: 2em, bottom: 0.5em),
  list: (top: 0.8em)
)

// -- Show rules ---------------------------------------------------------------
#show heading.where(level: 1): it => {
  align(center)[
    #text(size: sizes.name, weight: "bold")[#it]
  ]
}

#show heading.where(level: 2): set block(above: margins.section.top, below: margins.section.bottom)

#show heading.where(level: 2): it => {
  smallcaps[#text(size: sizes.section, weight: "bold")[#it]]
  block(above: margins.section-line.top, below: margins.section-line.bottom)[
    #line(length: 100%, stroke: 0.5pt + black)
  ]
}

#show link: it => {
  underline(offset: 3pt)[#it]
}

#show list: set block(above: margins.list.top)

#let profile_links(content) = {
  align(center)[#content]
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
  if s == "" { "" } else { s + " -- " + (if e != "" { e } else { "Present" }) }
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
    [#location],
    [#emph(degree)],
    [#emph(date_range(dates))],
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
    [#date_range(dates)],
    [#emph(organization)],
    [#emph(location)],
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
    [#strong(name) | #if skills.len() > 0 { emph(skills.join(", ")) }],
    [#emph(date_range(dates))],
  )
  list(..bullets.map(b => [#b]))
}

#let skills(items: ()) = {
  for it in items {
    let label = it.at(0, default: "")
    let values = it.at(1, default: ())
    if label != "" and values.len() > 0 {
      list([#strong(label): #values.join(", ")])
    }
  }
}

