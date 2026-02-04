// Shared form utilities and types
import type { FormError } from "../../useCanon"

export type FormFieldProps = {
  value: string
  onChange: (value: string) => void
  hasError?: boolean
  placeholder?: string
  label: string
  required?: boolean
}

// Base input styles
export const inputBase = "w-full px-3 py-2 bg-white rounded-lg text-gray-900 border text-sm"
export const inputBorder = (hasError?: boolean) => (hasError ? "border-red-500" : "border-gray-300")

// Text input field
export function TextField({ label, required, value, onChange, hasError, placeholder }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && " *"}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} ${inputBorder(hasError)}`}
        placeholder={placeholder}
      />
    </div>
  )
}

// Date input field
export function DateField({ label, required, value, onChange, hasError }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && " *"}
      </label>
      <input
        type="date"
        max="9999-12-31"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} ${inputBorder(hasError)}`}
      />
    </div>
  )
}

// Textarea field
export function TextareaField({ label, required, value, onChange, hasError, placeholder }: FormFieldProps & { rows?: number }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && " *"}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className={`${inputBase} ${inputBorder(hasError)}`}
        placeholder={placeholder}
      />
    </div>
  )
}

// Tags input (comma-separated)
export function TagsField({ label, required, value, onChange, hasError, placeholder }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && " *"}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputBase} ${inputBorder(hasError)}`}
        placeholder={placeholder}
      />
      <p className="text-gray-400 text-xs mt-0.5">Separate with commas</p>
    </div>
  )
}

// Form section with border
export function FormSection({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="space-y-3">
      {title && <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h4>}
      {children}
    </div>
  )
}

export type { FormError }
