#let safe_at(d, key, default: none) = {
  if d == none { default } else { d.at(key, default: default) }
}

#let dt_from_parts(p) = {
  if p == none { none } else {
    let y = safe_at(p, "year", default: none)
    let m = safe_at(p, "month", default: 1)
    if y == none { none } else { datetime(year: y, month: m, day: 1) }
  }
}

#let data = json.decode(sys.inputs.at("data", default: "{}"))
#let profile = data.at("profile", default: (:))
#let sections = data.at("sections", default: ())

= #(safe_at(profile, "name", default: "User"))

#let links = safe_at(profile, "links", default: ())
#let contact = safe_at(profile, "contact", default: "")

#if links.len() > 0 [
  #let joined = links.map(l => {
    let text = safe_at(l, "text", default: "")
    if text == "" { [] }
    else {
      let href = safe_at(l, "href", default: none)
      if href == none { [#text] } else { link(href)[#text] }
    }
  }).join([ | ])

  #align(center)[#joined]
] else if contact != "" [
  #align(center)[#contact]
]

#for sec in sections [
  #let title = safe_at(sec, "title", default: "")
  #let entries = safe_at(sec, "entries", default: ())
  #if title == "" or entries.len() == 0 { continue }

  == #title

  #for e in entries [
    #let kind = safe_at(e, "kind", default: "")

    #if kind == "school" [
      #school(
        institution: safe_at(e, "institution", default: ""),
        location: safe_at(e, "location", default: ""),
        dates: (
          start: dt_from_parts(safe_at(safe_at(e, "dates", default: none), "start", default: none)),
          end: dt_from_parts(safe_at(safe_at(e, "dates", default: none), "end", default: none)),
        ),
        degree: safe_at(e, "degree", default: ""),
        GPA: safe_at(e, "gpa", default: ""),
        bullets: safe_at(e, "bullets", default: ()),
      )
    ] else if kind == "work" [
      #work(
        organization: safe_at(e, "organization", default: ""),
        location: safe_at(e, "location", default: ""),
        dates: (
          start: dt_from_parts(safe_at(safe_at(e, "dates", default: none), "start", default: none)),
          end: dt_from_parts(safe_at(safe_at(e, "dates", default: none), "end", default: none)),
        ),
        position: safe_at(e, "position", default: ""),
        skills: safe_at(e, "skills", default: ()),
        bullets: safe_at(e, "bullets", default: ()),
      )
    ] else if kind == "project" [
      #project(
        name: safe_at(e, "name", default: ""),
        dates: (
          start: dt_from_parts(safe_at(safe_at(e, "dates", default: none), "start", default: none)),
          end: dt_from_parts(safe_at(safe_at(e, "dates", default: none), "end", default: none)),
        ),
        skills: safe_at(e, "skills", default: ()),
        bullets: safe_at(e, "bullets", default: ()),
      )
    ] else if kind == "skills" [
      #let items = safe_at(e, "items", default: ())
      #skills(
        items: items.map(it => (
          safe_at(it, "label", default: ""),
          safe_at(it, "values", default: ()),
        )),
      )
    ]
  ]
]
