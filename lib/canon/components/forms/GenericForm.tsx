import { TextField, DateField, TextareaField, Props } from "./shared"

export function GenericFormFields({ form, setForm, hasError }: Props) {
  const update = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-4">
      <TextField label="Title" required value={form.title ?? ""} onChange={update("title")} hasError={hasError("title")} placeholder="Item title" />

      <div className="grid grid-cols-2 gap-3">
        <DateField label="Start Date" value={form.start ?? ""} onChange={update("start")} />
        <DateField label="End Date" value={form.end ?? ""} onChange={update("end")} />
      </div>

      <TextareaField label="Details" value={form.bullets ?? ""} onChange={update("bullets")} placeholder="One item per line" />
    </div>
  )
}
