"use client"

import { Spinner } from "@/lib/shared/components/Spinner"

export function ResumeLoadingView() {
  return (
    <div className="page-container">
      <div className="page-bg-gradient"></div>
      <div className="relative z-10 pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <Spinner size={40} />
            <p style={{ color: "var(--ink-light)" }}>Loading your resume...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
