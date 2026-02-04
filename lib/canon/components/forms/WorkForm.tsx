import { TextField, DateField, TextareaField, TagsField } from "./shared"

type Props = {
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
  hasError: (field: string) => boolean
}

export function WorkFormFields({ form, setForm, hasError }: Props) {
  const update = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-4">
      {/* Row 1: Company + Role */}
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Company" required value={form.org ?? ""} onChange={update("org")} hasError={hasError("org")} placeholder="Google, Microsoft..." />
        <TextField label="Position" required value={form.role ?? ""} onChange={update("role")} hasError={hasError("role")} placeholder="Software Engineer..." />
      </div>

      {/* Row 2: Dates */}
      <div className="grid grid-cols-2 gap-3">
        <DateField label="Start Date" required value={form.start ?? ""} onChange={update("start")} hasError={hasError("start")} />
        <DateField label="End Date" value={form.end ?? ""} onChange={update("end")} hasError={hasError("end")} />
      </div>

      {/* Bullets */}
      <TextareaField label="Bullet Points" required value={form.bullets ?? ""} onChange={update("bullets")} hasError={hasError("bullets")} placeholder="One per line&#10;• Built X&#10;• Improved Y" />

      {/* Skills */}
      <TagsField label="Skills" value={form.skills ?? ""} onChange={update("skills")} hasError={hasError("skills")} placeholder="JavaScript, React, Node.js" />
    </div>
  )
}
