"use client"

import { useEffect, useMemo, useState } from "react"
import type { CanonItem, ItemType } from "@/lib/types"
import type { FormError } from "../useCanon"
import { getFieldsForType, type FieldConfig } from "../fields"
import { WorkFormFields, EducationFormFields, ProjectFormFields, SkillFormFields, LinkFormFields, GenericFormFields, inputBase } from "./forms"

type Props = {
  itemTypes: ItemType[]
  editing?: CanonItem<unknown> | null
  defaultTypeId?: string
  onCancel: () => void
  onSubmit: (payload: { item_type_id: string; title: string; position: number; content: Record<string, unknown> }) => Promise<void> | void
  saving?: boolean
  error?: FormError
}

export function CanonForm({ itemTypes, editing, defaultTypeId, onCancel, onSubmit, saving, error }: Props) {
  const [selectedTypeId, setSelectedTypeId] = useState<string>(editing?.item_type_id ?? defaultTypeId ?? itemTypes[0]?.id ?? "")

  const selectedType = useMemo(() => itemTypes.find((t) => t.id === selectedTypeId), [itemTypes, selectedTypeId])
  const typeName = selectedType?.display_name ?? ""
  const fields = useMemo(() => getFieldsForType(typeName), [typeName])

  const [form, setForm] = useState<Record<string, string>>({})

  // Initialize form when editing or type changes
  useEffect(() => {
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

    setForm(initial)
  }, [fields, editing])

  useEffect(() => {
    if (!editing && defaultTypeId) {
      setSelectedTypeId(defaultTypeId)
    }
  }, [defaultTypeId, editing])

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
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
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
