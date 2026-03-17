"use client"

import { TemplateSelectorButton } from "@/lib/resume-builder/components/TemplateSelectorButton"
import { ResumePreview } from "@/lib/resume-builder/components/ResumePreview"

type ResumePreviewPaneProps = {
  versionName: string | null
  versionSavedAt: string | null
  updatedAt?: string | null
  selectedTemplateId: string
  currentTemplateId?: string
  onTemplateSelect: (id: string) => void
  formatDateTime: (value: string) => string
  previewSections: unknown[]
  previewProfile?: {
    name?: string
    links?: { text: string; href?: string }[]
  }
}

export function ResumePreviewPane({
  versionName,
  versionSavedAt,
  updatedAt,
  selectedTemplateId,
  currentTemplateId,
  onTemplateSelect,
  formatDateTime,
  previewSections,
  previewProfile,
}: ResumePreviewPaneProps) {
  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div
        className="bg-white rounded-2xl border shadow-sm flex flex-col flex-1 overflow-hidden"
        style={{ borderColor: "var(--grid)" }}
      >
        <div className="p-8 border-b shrink-0 bg-white z-10" style={{ borderColor: "var(--grid)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <h3
              className="text-2xl font-semibold"
              style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
            >
              Resume Preview
            </h3>

            <TemplateSelectorButton
              selectedTemplateId={currentTemplateId ?? "classic"}
              onSelect={(id) => {
                onTemplateSelect(id)
              }}
            />

            <div className="flex flex-col items-end gap-1">
              {versionName && (
                <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                  Version: {versionName}
                </p>
              )}
              {(versionSavedAt || updatedAt) && (
                <p className="text-xs" style={{ color: "var(--ink-fade)" }}>
                  Updated at: {formatDateTime((versionSavedAt || updatedAt)!)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
          <div className="rounded-b-2xl overflow-clip">
            <ResumePreview
              sections={previewSections as { typeName: string; typeId: string; items: unknown[] }[]}
              profile={previewProfile}
              selectedTemplate={selectedTemplateId}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
