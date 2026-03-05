/// Linear layout: one column, sections and entries in top-to-bottom order.
/// Loaded before the theme so that themes can set render-resume = render-resume-linear.
#let render-resume-linear(profile, sections) = {
  profile-header(
    name: profile.at("name", default: "User"),
    links: profile.at("links", default: ()),
    contact: profile.at("contact", default: ""),
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
