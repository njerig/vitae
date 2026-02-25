import { TextField, DateField, TextareaField, TagsField, Props } from "./shared"

export function WorkFormFields({ form, setForm, hasError }: Props) {
  const update = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-4">
      {/* Row 1: Position */}
      <TextField
          label="Position"
          required
          value={form.role ?? ""}
          onChange={update("role")}
          hasError={hasError("role")}
          placeholder="Software Engineer..."
        />
      {/* Row 2: Company + Location */}
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Company"
          required
          value={form.org ?? ""}
          onChange={update("org")}
          hasError={hasError("org")}
          placeholder="Google, Microsoft..."
        />
        <TextField
          label="Location"
          required
          value={form.location ?? ""}
          onChange={update("location")}
          hasError={hasError("location")}
          placeholder="San Francisco, CA"
        />
      </div>

      {/* Row 2: Dates */}
      <div className="grid grid-cols-2 gap-3">
        <DateField label="Start Date" required value={form.start ?? ""} onChange={update("start")} hasError={hasError("start")} />
        <DateField label="End Date" value={form.end ?? ""} onChange={update("end")} hasError={hasError("end")} />
      </div>

      {/* Bullets */}
      <TextareaField
        label="Bullet Points"
        required
        value={form.bullets ?? ""}
        onChange={update("bullets")}
        hasError={hasError("bullets")}
        placeholder="Improved X by YY%"
      />

      {/* Skills */}
      <TagsField
        label="Skills"
        value={form.skills ?? ""}
        onChange={update("skills")}
        hasError={hasError("skills")}
        placeholder="JavaScript, React, Node.js"
      />
    </div>
  )
}
