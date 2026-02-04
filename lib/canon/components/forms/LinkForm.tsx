import { Props, TextField } from "./shared"

export function LinkFormFields({ form, setForm, hasError }: Props) {
  const update = (key: string) => (val: string) => setForm((p) => ({ ...p, [key]: val }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Label"
          required
          value={form.label ?? ""}
          onChange={update("label")}
          hasError={hasError("label")}
          placeholder="LinkedIn, GitHub, Portfolio"
        />
        <TextField
          label="URL"
          required
          value={form.url ?? ""}
          onChange={update("url")}
          hasError={hasError("url")}
          placeholder="https://linkedin.com/in/..."
        />
      </div>
    </div>
  )
}
