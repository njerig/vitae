"use client"

import { useState, useMemo } from "react"
import type { CanonItem, ItemType } from "@/lib/types"
import type { OverrideData } from "@/lib/working-state/useWorkingState"
import type { FormError } from "@/lib/canon/useCanon"
import { getFieldsForType, type FieldConfig } from "@/lib/canon/fields"
import { getContentSchema } from "@/lib/schemas"
import { WorkFormFields } from "@/lib/canon/components/forms/WorkForm"
import { EducationFormFields } from "@/lib/canon/components/forms/EducationForm"
import { ProjectFormFields } from "@/lib/canon/components/forms/ProjectForm"
import { SkillFormFields } from "@/lib/canon/components/forms/SkillForm"
import { LinkFormFields } from "@/lib/canon/components/forms/LinkForm"
import { GenericFormFields } from "@/lib/canon/components/forms/GenericForm"
import { Spinner } from "@/lib/components/Spinner"
import toast from "react-hot-toast"

type Props = {
  item: CanonItem<unknown>
  typeName: string
  itemTypes: ItemType[]
  override?: OverrideData
  onSave: (itemId: string, override: OverrideData) => Promise<void>
  onReset: (itemId: string) => Promise<void>
  onClose: () => void
  saving?: boolean
}

export function EditOverrideModal({ item, typeName, itemTypes, override, onSave, onReset, onClose, saving }: Props) {
  const fields = useMemo(() => getFieldsForType(typeName), [typeName])
  const [error, setError] = useState<FormError>(null)

  // Build initial form values from current item content (with override applied)
  const initialForm = useMemo(() => {
    const content = (override?.content
      ? { ...(item.content as Record<string, unknown>), ...override.content }
      : (item.content ?? {})) as Record<string, unknown>
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
  }, [fields, item, override])

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

  const handleSubmit = async () => {
    setError(null)
    const content = buildContent()

    // Validate using the type-specific schema
    const schema = getContentSchema(typeName)
    const result = schema.safeParse(content)
    if (!result.success) {
      const fieldNames: string[] = []
      const messages = result.error.issues.map((issue: any) => {
        const field = String(issue.path?.[0] ?? "")
        if (field) fieldNames.push(field)
        return `• ${field || "Field"}: ${issue.message}`
      })
      setError({ message: messages.join("\n"), fields: fieldNames })
      return
    }

    // Determine title
    const titleField = fields.find((f: FieldConfig) => f.name === "title") || fields.find((f: FieldConfig) => f.required && f.type === "text")
    const title = titleField ? (form[titleField.name] ?? "") : undefined

    try {
      await onSave(item.id, { title, content })
      toast.success("Override saved successfully")
      onClose()
    } catch {
      toast.error("Failed to save override")
    }
  }

  const handleReset = async () => {
    try {
      await onReset(item.id)
      toast.success("Reset to original")
      onClose()
    } catch {
      toast.error("Failed to reset override")
    }
  }

  // Render type-specific form fields (same as CanonForm)
  const renderFormFields = () => {
    const props = { form, setForm, hasError }

    switch (typeName) {
      case "Work Experience":
        return <WorkFormFields {...props} />
      case "Education":
        return <EducationFormFields {...props} />
      case "Project":
        return <ProjectFormFields {...props} />
      case "Skill":
        return <SkillFormFields {...props} />
      case "Link":
        return <LinkFormFields {...props} />
      default:
        return <GenericFormFields {...props} />
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        style={{ maxWidth: "600px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-xl font-semibold mb-1"
          style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
        >
          Edit for This Resume
        </h3>
        <p className="text-sm mb-4" style={{ color: "var(--ink-fade)" }}>
          Changes only affect this resume, not the original item.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm whitespace-pre-wrap"
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
            }}
          >
            {error.message}
          </div>
        )}

        <div className="space-y-4">
          {/* Show type as read-only info */}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: "var(--ink-fade)" }}>
              Item Type
            </label>
            <div
              className="w-full px-3 py-2 rounded-lg text-sm border"
              style={{
                backgroundColor: "var(--paper-dark)",
                borderColor: "var(--grid)",
                color: "var(--ink)",
              }}
            >
              {typeName}
            </div>
          </div>

          {/* Type-specific form fields */}
          {renderFormFields()}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Spinner size={16} color="white" inline />
                  Saving...
                </span>
              ) : (
                "Save Override"
              )}
            </button>
            {override && (
              <button
                onClick={handleReset}
                disabled={saving}
                className="card-action-delete"
              >
                Reset to Original
              </button>
            )}
            <button
              onClick={onClose}
              disabled={saving}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
