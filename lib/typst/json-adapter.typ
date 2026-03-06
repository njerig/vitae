/// = JSON Adapter Contract
/// 
/// The JSON adapter is used to parse JSON from the database into a format that
/// can be used by the theme.
/// 
/// == Contract
/// Profile: (name: str, links: (text: str, href: str | none)[])
/// Section: (title: str, entries: Entry[])
/// Entry: one of
///   Work: (kind: "work", position: str, organization: str, location: str, dates: (start: datetime, end: datetime | none), skills: str[], bullets: str[])
///   School: (kind: "school", institution: str, location: str, dates: (start: datetime, end: datetime | none), degree: str, gpa: str, bullets: str[])
///   Project: (kind: "project", name: str, url: str | none, dates: (start: datetime, end: datetime | none), skills: str[], bullets: str[])
///   Skills: (kind: "skills", items: (label: str, values: str[])[])

/// == Theme API
/// Entry point: render-resume(profile: Profile, sections: Section[])
/// Components:
///   profile_header(name: str, links: (text: str, href: str | none)[])
///   school(institution: str, location: str, dates: (start: datetime, end: datetime | none), degree: str, gpa: str, bullets: str[])
///   work(position: str, organization: str, location: str, dates: (start: datetime, end: datetime | none), skills: str[], bullets: str[])
///   project(name: str, dates: (start: datetime, end: datetime | none), skills: str[], bullets: str[])
///   skills(items: (label: str, values: str[])[])

/// == Future layout options
///   render-resume may later accept an optional third parameter for layout hints 
///   (like fitting to a certain number of pages).


// -- Parsing helpers ----------------------------------------------------------

/// A helper to safely access a dictionary key, returning a default value if the
/// key is not found or the value is none.
/// - d (dict): the dictionary to access
/// - key (str): the key to access
/// - default (any): the default value to return if the key is not found or the value is none
/// -> any
#let safe-at(d, key, default: none) = {
  if d == none { default } else { d.at(key, default: default) }
}

/// A helper to parse a date from a dictionary of parts.
/// - p (dict): the dictionary to parse
/// -> datetime | none
#let datetime-from-parts(p) = {
  if p == none { none } else {
    let y = safe-at(p, "year", default: none)
    let m = safe-at(p, "month", default: 1)
    if y == none { none } else { datetime(year: y, month: m, day: 1) }
  }
}

/// A helper to parse a date range from a dictionary of parts.
/// - dates-dict (dict): the dictionary to parse
/// -> (start: datetime | none, end: datetime | none)
#let parse-dates(dates-dict) = {
  let start = safe-at(dates-dict, "start", default: none)
  let end = safe-at(dates-dict, "end", default: none)
  (
    start: datetime-from-parts(start),
    end: datetime-from-parts(end),
  )
}

// -- Section parsers ----------------------------------------------------------

/// A helper to parse a profile from a dictionary.
/// - profile (dict): the dictionary to parse
/// -> Profile
#let parse-profile(profile) = {
  let name = safe-at(profile, "name", default: "User")
  let links = safe-at(profile, "links", default: ()).map(l => (
    text: safe-at(l, "text", default: ""),
    href: safe-at(l, "href", default: none),
  ))
  (
    name: name,
    links: links
  )
}

/// A helper to parse a school entry from a dictionary.
/// - entry (dict): the dictionary to parse
/// -> School
#let parse-school(entry) = {
  (
    kind: "school",
    institution: safe-at(entry, "institution", default: ""),
    location: safe-at(entry, "location", default: ""),
    dates: parse-dates(safe-at(entry, "dates", default: none)),
    degree: safe-at(entry, "degree", default: ""),
    gpa: safe-at(entry, "gpa", default: ""),
    bullets: safe-at(entry, "bullets", default: ()),
  )
}

/// A helper to parse a work entry from a dictionary.
/// - entry (dict): the dictionary to parse
/// -> Work
#let parse-work(entry) = {
  (
    kind: "work",
    position: safe-at(entry, "position", default: ""),
    organization: safe-at(entry, "organization", default: ""),
    location: safe-at(entry, "location", default: ""),
    dates: parse-dates(safe-at(entry, "dates", default: none)),
    skills: safe-at(entry, "skills", default: ()),
    bullets: safe-at(entry, "bullets", default: ()),
  )
}

/// A helper to parse a project entry from a dictionary.
/// - entry (dict): the dictionary to parse
/// -> Project
#let parse-project(entry) = {
  (
    kind: "project",
    name: safe-at(entry, "name", default: ""),
    url: safe-at(entry, "url", default: none),
    dates: parse-dates(safe-at(entry, "dates", default: none)),
    skills: safe-at(entry, "skills", default: ()),
    bullets: safe-at(entry, "bullets", default: ()),
  )
}

/// A helper to parse a skills entry from a dictionary.
/// - entry (dict): the dictionary to parse
/// -> Skills
#let parse-skills(entry) = {
  (
    kind: "skills",
    items: safe-at(entry, "items", default: ()).map(it => (
      label: safe-at(it, "label", default: ""),
      values: safe-at(it, "values", default: ()),
    )),
  )
}

/// A helper to parse a list of sections from a list of dictionaries.
/// - sections (list): the list of dictionaries to parse
/// -> Section[]
#let parse-sections(sections) = {
  sections.map(sec => (
    title: safe-at(sec, "title", default: ""),
    entries: safe-at(sec, "entries", default: ()).map(e => {
      let kind = safe-at(e, "kind", default: "")
      let dates = parse-dates(safe-at(e, "dates", default: none))
      if kind == "school" {
        parse-school(e)
      } else if kind == "work" {
        parse-work(e)
      } else if kind == "project" {
        parse-project(e)
      } else if kind == "skills" {
        parse-skills(e)
      } else {
        (kind: "",)
      }
    }),
  ))
}

// -- Entry point --------------------------------------------------------------
// Data is passed as a path to a JSON file in the compiler workspace (avoids "File name too long").
#let data-path = sys.inputs.at("data", default: "")
#let data = if data-path != "" { json.decode(read(data-path)) } else { (:) }
#let profile = data.at("profile", default: (:))
#let sections = data.at("sections", default: ())

#render-resume(parse-profile(profile), parse-sections(sections))
