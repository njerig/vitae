import { TextField, TagsField, Props } from "./shared"

export function SkillFormFields({ form, setForm, hasError }: Props) {
  const update = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-4">
      <TextField
        label="Category"
        required
        value={form.category ?? ""}
        onChange={update("category")}
        hasError={hasError("category")}
        placeholder="Languages, Frameworks, Tools"
      />
      <TagsField
        label="Skills"
        required
        value={form.skills ?? ""}
        onChange={update("skills")}
        hasError={hasError("skills")}
        placeholder="JavaScript, Python, Go"
      />
    </div>
  )
}
