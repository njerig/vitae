import { TextField, DateField, TextareaField } from "./shared"

type Props = {
  form: Record<string, string>
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
  hasError: (field: string) => boolean
}

export function EducationFormFields({ form, setForm, hasError }: Props) {
  const update = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-4">
      {/* Institution */}
      <TextField label="Institution" required value={form.institution ?? ""} onChange={update("institution")} hasError={hasError("institution")} placeholder="UC Santa Cruz" />

      {/* Row: Degree + Field */}
      <div className="grid grid-cols-2 gap-3">
        <TextField label="Degree" value={form.degree ?? ""} onChange={update("degree")} placeholder="Bachelor of Science" />
        <TextField label="Field of Study" value={form.field ?? ""} onChange={update("field")} placeholder="Computer Science" />
      </div>

      {/* Row: Dates + GPA */}
      <div className="grid grid-cols-3 gap-3">
        <DateField label="Start Date" value={form.start ?? ""} onChange={update("start")} hasError={hasError("start")} />
        <DateField label="End Date" value={form.end ?? ""} onChange={update("end")} hasError={hasError("end")} />
        <TextField label="GPA" value={form.gpa ?? ""} onChange={update("gpa")} placeholder="3.8" />
      </div>

      {/* Details */}
      <TextareaField label="Details" value={form.bullets ?? ""} onChange={update("bullets")} placeholder="Relevant coursework, honors..." />
    </div>
  )
}
