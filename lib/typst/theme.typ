#set page(margin: (
  left: 0.5in,
  right: 0.5in,
  top: 0.5in,
  bottom: 0.5in,
))

#show heading.where(level: 1): it => {
  align(center)[
    #text(size: 20pt, weight: "bold")[#it]
  ]
}

#show heading.where(level: 2): set block(above: 2em, below: 0.5em)

#show heading.where(level: 2): it => {
  smallcaps[#text(size: 16pt)[#it]]
  block(above: 0.5em, below: 0.75em)[
    #line(length: 100%, stroke: 0.5pt + black)
  ]
}

#show link: it => {
  set text(fill: blue)
  underline(offset: 3pt)[#it]
}

#let date_pattern = "[month repr:short]. [year]"

#let fmt_date(d) = {
  if d == none { "" } else { d.display(date_pattern) }
}

#let date_range(dates) = {
  let s = fmt_date(dates.start)
  let e = fmt_date(dates.end)
  if s == "" { "" } else { s + " - " + (if e != "" { e } else { "Present" }) }
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
    [#emph(date_range(dates))],
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

