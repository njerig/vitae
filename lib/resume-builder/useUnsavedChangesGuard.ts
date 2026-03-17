"use client"

import { useState } from "react"

type EditMode = "manual" | "ai"

type RequestModeChangeOptions = {
  onSwitchToAi?: () => void
  onDiscardManual?: () => void
  onDiscardAi?: () => void
}

/**
 * Manages unsaved-change guarding for transitions between manual and AI editing flows.
 * Queues actions behind a confirmation modal when the active mode has dirty changes.
 *
 * @returns Guard state and transition handlers for mode + modal flows.
 */
export function useUnsavedChangesGuard(initialMode: EditMode = "manual") {
  const [editMode, setEditMode] = useState<EditMode>(initialMode)
  const [manualDirty, setManualDirty] = useState(false)
  const [aiDirty, setAiDirty] = useState(false)
  const [pendingTransition, setPendingTransition] = useState<null | (() => void)>(null)
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false)

  const requestTransition = (nextAction: () => void, discardCurrentContext: () => void) => {
    const hasUnappliedChanges = editMode === "manual" ? manualDirty : aiDirty
    if (!hasUnappliedChanges) {
      nextAction()
      return
    }

    setPendingTransition(() => () => {
      discardCurrentContext()
      nextAction()
    })
    setShowUnsavedPrompt(true)
  }

  const requestModeChange = (targetMode: EditMode, options?: RequestModeChangeOptions) => {
    if (targetMode === editMode) return

    requestTransition(
      () => {
        setEditMode(targetMode)
        if (targetMode === "ai") options?.onSwitchToAi?.()
      },
      () => {
        if (editMode === "manual") {
          setManualDirty(false)
          options?.onDiscardManual?.()
          return
        }

        setAiDirty(false)
        options?.onDiscardAi?.()
      }
    )
  }

  const requestManualClose = (onClose: () => void, onDiscardManual?: () => void) => {
    requestTransition(
      () => onClose(),
      () => {
        setManualDirty(false)
        onDiscardManual?.()
      }
    )
  }

  const stayWithChanges = () => {
    setShowUnsavedPrompt(false)
    setPendingTransition(null)
  }

  const discardAndContinue = () => {
    const next = pendingTransition
    setShowUnsavedPrompt(false)
    setPendingTransition(null)
    next?.()
  }

  return {
    editMode,
    manualDirty,
    aiDirty,
    showUnsavedPrompt,
    setManualDirty,
    setAiDirty,
    requestModeChange,
    requestManualClose,
    stayWithChanges,
    discardAndContinue,
  }
}
