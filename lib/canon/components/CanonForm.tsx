"use client"

import { useMemo, useState } from "react"
import type { CanonItem, ItemType } from "@/lib/types"
import type { FormError } from "../useCanon"
import { getFieldsForType, type FieldConfig } from "../fields"
import { WorkFormFields } from "./forms/WorkForm"
import { EducationFormFields } from "./forms/EducationForm"
import { ProjectFormFields } from "./forms/ProjectForm"
import { SkillFormFields } from "./forms/SkillForm"
import { LinkFormFields } from "./forms/LinkForm"
import { GenericFormFields } from "./forms/GenericForm"

type Props = {
  itemTypes: ItemType[]
  editing?: CanonItem<unknown> | null
  defaultTypeId?: string
  onCancel: () => void
  onSubmit: (payload: { item_type_id: string; title: string; position: number; content: Record<string, unknown> }) => Promise<void> | void
  saving?: boolean
  error?: FormError
}

// Base input styles
const inputBase = "w-full px-3 py-2 bg-white rounded-lg text-gray-900 border text-sm"

export function CanonForm({ itemTypes, editing, defaultTypeId, onCancel, onSubmit, saving, error }: Props) {
  // Compute initial type ID from props (no effect needed)
  const initialTypeId = editing?.item_type_id ?? defaultTypeId ?? itemTypes[0]?.id ?? ""
  const [selectedTypeId, setSelectedTypeId] = useState<string>(initialTypeId)

  const selectedType = useMemo(() => itemTypes.find((t) => t.id === selectedTypeId), [itemTypes, selectedTypeId])
  const typeName = selectedType?.display_name ?? ""
  const fields = useMemo(() => getFieldsForType(typeName), [typeName])

  // Compute initial form values from props (no effect needed)
  const initialForm = useMemo(() => {
    const content = (editing?.content ?? {}) as Record<string, unknown>
    const initial: Record<string, string> = {}

    fields.forEach((field: FieldConfig) => {
      const value = content[field.name]
      if (field.type === "tags" && Array.isArray(value)) {
        initial[field.name] = value.join(", ")
      } else if (field.type === "textarea" && Array.isArray(value)) {
        initial[field.name] = value.join("\n")
      } else {
        initial[field.name] = (value as string) ?? ""
      }
    })

    return initial
  }, [fields, editing])

  const [form, setForm] = useState<Record<string, string>>(initialForm)

  const hasError = (fieldName: string) => error?.fields.includes(fieldName) ?? false

  const buildContent = () => {
    const content: Record<string, unknown> = {}

    fields.forEach((field: FieldConfig) => {
      const value = form[field.name] ?? ""

      if (field.type === "tags") {
        content[field.name] = value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      } else if (field.type === "textarea") {
        content[field.name] = value
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      } else if (field.type === "date") {
        content[field.name] = value || null
      } else {
        content[field.name] = value
      }
    })

    return content
  }

  const submit = async () => {
    const content = buildContent()
    const titleField = fields.find((f: FieldConfig) => f.name === "title") || fields.find((f: FieldConfig) => f.required && f.type === "text")
    const title = titleField ? (form[titleField.name] ?? "") : ""

    await onSubmit({
      item_type_id: selectedTypeId,
      title,
      position: 0,
      content,
    })
  }

  // Render type-specific form fields
  const renderFormFields = () => {
    const props = { form, setForm, hasError }

    switch (typeName) {
      case "Work Experience":
        return <WorkFormFields {...props} />
      case "Education":
        return <EducationFormFields {...props} />
      case "Projects":
        return <ProjectFormFields {...props} />
      case "Skills":
        return <SkillFormFields {...props} />
      case "Links":
        return <LinkFormFields {...props} />
      default:
        return <GenericFormFields {...props} />
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">{editing ? "Edit Item" : "Add New Item"}</h3>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm whitespace-pre-wrap">{error.message}</div>}

      <div className="space-y-4">
        {/* Type selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item Type</label>
          <select
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            disabled={!!editing}
            className={`${inputBase} ${editing ? "bg-gray-100 cursor-not-allowed" : ""} border-gray-300`}
          >
            {itemTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.display_name}
              </option>
            ))}
          </select>
        </div>

        {/* Type-specific fields */}
        {renderFormFields()}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={submit} disabled={saving} className="btn-primary">
            {editing ? "Update" : "Add Item"}
          </button>
          <button onClick={onCancel} disabled={saving} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
