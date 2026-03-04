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

#let profile_links(content) = {
  align(end)[#content]
}

#let profile_header(
  name: "User",
  links: (),
  contact: "",
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
  } else if contact != "" {
    (contact,)
  } else {
    ()
  }
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

