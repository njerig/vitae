import { TextField, DateField, TextareaField, TagsField } from "./shared"

type Props = {
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
  hasError: (field: string) => boolean
}

export function ProjectFormFields({ form, setForm, hasError }: Props) {
  const update = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-4">
      {/* Row: Title + URL */}
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Project Name" required value={form.title ?? ""} onChange={update("title")} hasError={hasError("title")} placeholder="My Awesome Project" />
        <TextField label="URL" value={form.url ?? ""} onChange={update("url")} placeholder="https://github.com/..." />
      </div>

      {/* Description */}
      <TextField label="Description" value={form.description ?? ""} onChange={update("description")} placeholder="A brief description" />

      {/* Dates in row */}
      <div className="grid grid-cols-2 gap-3">
        <DateField label="Start Date" value={form.start ?? ""} onChange={update("start")} />
        <DateField label="End Date" value={form.end ?? ""} onChange={update("end")} />
      </div>

      {/* Details */}
      <TextareaField label="Details" value={form.bullets ?? ""} onChange={update("bullets")} placeholder="Key features, technologies used" />

      {/* Skills */}
      <TagsField label="Technologies" value={form.skills ?? ""} onChange={update("skills")} placeholder="React, TypeScript, AWS" />
    </div>
  )
}
