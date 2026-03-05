"use client"

import { Sparkles } from "lucide-react"

type TailorButtonProps = {
  onClick: () => void
}

export function TailorButton({ onClick }: TailorButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-primary h-14 rounded-lg flex items-center justify-center gap-1.5 w-32" 
      style={{ padding: "0.8rem", fontSize: "0.8rem" }}
      title="Tailor resume to a job description"
    >
      <Sparkles className="w-4 h-4" />
      Tailor
    </button>
  )
}
