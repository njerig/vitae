"use client"

import Link from "next/link"
import { ChevronLeft, Download } from "lucide-react"
import { SegmentedSwitch } from "@/lib/shared/components/SegmentedSwitch"
import { SaveResumeButton } from "@/lib/versions/components/save/SaveResumeButton"
import { Spinner } from "@/lib/shared/components/Spinner"

type ResumeBuilderToolbarProps = {
  isDirty: boolean
  editMode: "manual" | "ai"
  onEditModeChange: (mode: "manual" | "ai") => void
  workingState: {
    sections: {
      item_type_id: string
      item_ids: string[]
    }[]
  }
  parentVersionId: string | null
  syncToBackend: () => Promise<void>
  onExportPdf: () => void
  exportingPdf: boolean
}

export function ResumeBuilderToolbar({
  isDirty,
  editMode,
  onEditModeChange,
  workingState,
  parentVersionId,
  syncToBackend,
  onExportPdf,
  exportingPdf,
}: ResumeBuilderToolbarProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm flex flex-row justify-between items-center gap-2 z-20 shrink-0 mb-6">
      <div className="flex flex-row items-center gap-6">
        <Link href="/home">
          <ChevronLeft className="h-6 w-6 cursor-pointer text-gray-500 hover:text-gray-900 transition-colors" />
        </Link>
        <div className="flex flex-col gap-0.5">
          <span
            className="text-2xl font-semibold whitespace-nowrap"
            style={{ color: "var(--ink)", fontFamily: "var(--font-serif)" }}
          >
            Resume Builder
          </span>
          {isDirty && (
            <span className="text-xs" style={{ color: "var(--ink-fade)" }}>
              Unsaved changes
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-row items-center gap-4">
        <div className="flex flex-row items-center justify-center gap-2">
          <SegmentedSwitch
            value={editMode}
            onChange={(next) => onEditModeChange(next)}
            options={[
              { value: "manual", label: "Manual" },
              { value: "ai", label: "AI Tailor" },
            ]}
            variant="primary"
            size="sm"
            ariaLabel="Resume editing mode"
          />

          <SaveResumeButton
            workingState={workingState}
            parentVersionId={parentVersionId}
            syncToBackend={syncToBackend}
          />

          <button
            type="button"
            onClick={onExportPdf}
            disabled={exportingPdf}
            className="btn-secondary h-14 rounded-lg flex items-center justify-center gap-1.5 w-32"
            style={{ padding: "0.8rem", fontSize: "0.8rem" }}
            title="Download resume as PDF"
          >
            {exportingPdf ? (
              <Spinner size={13} color="var(--ink)" />
            ) : (
              <Download className="w-6 h-6" />
            )}
            Export PDF
          </button>
        </div>
      </div>
    </div>
  )
}
