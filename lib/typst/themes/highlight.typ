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

#set page(margin: (
  left: 0.5in,
  right: 0.5in,
  top: 0.5in,
  bottom: 0.5in,
))

#set text(font: "Crimson Pro", size: sizes.body)

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

#let profile_links(content) = {
  align(center)[#content]
}

#let profile_header(
  name: "User",
  links: (),
  contact: "",
) = {
  let parts = name.split(regex("\\s*,\\s*"))
  let primary = parts.at(0, default: name)
  let suffix = if parts.len() > 1 { parts.slice(1).join(", ") } else { "" }

  let right_content = if links.len() > 0 {
    links.map(l => {
      let text = l.at("text", default: "")
      if text == "" { [] }
      else {
        let href = l.at("href", default: none)
        if href == none { [#text] } else { link(href)[#text] }
      }
    }).join(linebreak())
  } else if contact != "" {
    contact
  } else {
    []
  }

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

#let date_pattern = "[month repr:short]. [year]"

#let dt_from_parts(p) = {
  if p == none { none } else {
    let y = p.at("year", default: none)
    let m = p.at("month", default: 1)
    if y == none { none } else { datetime(year: y, month: m, day: 1) }
  }
}

#let fmt_date(d) = {
  if d == none { "" } else { d.display(date_pattern) }
}

#let date_range(dates) = {
  let s = fmt_date(dates.start)
  let e = fmt_date(dates.end)
  if s == "" { "" } else { s + sym.dash.en + (if e != "" { e } else { "Present" }) }
}

#let school(
  institution: "",
  location: "",
  dates: (start: none, end: none),
  degree: "",
  GPA: "",
  bullets: (),
) = {  
  let has_body = GPA != "" or bullets.len() > 0
  grid(
    columns: (1fr, auto), gutter: 8pt, align: (left, right),
    [#strong(institution)],
    [#location],
    [#emph(degree)],
    [#emph(date_range(dates))],
  )
  if has_body {
    block(above: sizes.item-body-gap)[
      #if GPA != "" [
        GPA: #GPA
      ]
      #if bullets.len() > 0 [
        #list(..bullets.map(b => [#b]))
      ]
    ]
  }
}

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

#let skills(items: ()) = {
  let lines = items.map(it => {
    let label = it.at(0, default: "")
    let values = it.at(1, default: ())
    if label == "" or values.len() == 0 { [] }
    else { [#strong(label): #values.join(", ")] }
  })
  list(..lines)
}

#let render_sections(sections, linear_renderer) = {
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
        #for e in entries [
          #let kind = e.at("kind", default: "")

          #if kind == "school" [
            #let d = e.at("dates", default: (:))
            #school(
              institution: e.at("institution", default: ""),
              location: e.at("location", default: ""),
              dates: (
                start: dt_from_parts(d.at("start", default: none)),
                end: dt_from_parts(d.at("end", default: none)),
              ),
              degree: e.at("degree", default: ""),
              GPA: e.at("gpa", default: ""),
              bullets: e.at("bullets", default: ()),
            )
          ] else if kind == "work" [
            #let d = e.at("dates", default: (:))
            #work(
              position: e.at("position", default: ""),
              organization: e.at("organization", default: ""),
              location: e.at("location", default: ""),
              dates: (
                start: dt_from_parts(d.at("start", default: none)),
                end: dt_from_parts(d.at("end", default: none)),
              ),
              skills: e.at("skills", default: ()),
              bullets: e.at("bullets", default: ()),
            )
          ] else if kind == "project" [
            #let d = e.at("dates", default: (:))
            #project(
              name: e.at("name", default: ""),
              dates: (
                start: dt_from_parts(d.at("start", default: none)),
                end: dt_from_parts(d.at("end", default: none)),
              ),
              skills: e.at("skills", default: ()),
              bullets: e.at("bullets", default: ()),
            )
          ] else if kind == "skills" [
            #skills(
              items: e.at("items", default: ()).map(it => (
                it.at("label", default: ""),
                it.at("values", default: ()),
              )),
            )
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