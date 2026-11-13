"use client"

import { useEffect } from "react"

// Popups own their arrow keys and Esc; the review sheet itself is the exception.
const POPUP_SELECTOR = "[role=menu],[role=listbox],[role=grid],[role=dialog],[role=alertdialog]"

/** True when the key belongs to something else: a field, a popup, or a half-written rejection. */
function keyBelongsElsewhere(event: KeyboardEvent) {
  if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return true
  const target = event.target instanceof HTMLElement ? event.target : null
  if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return true
  const popup = target?.closest(POPUP_SELECTOR)
  if (popup && !popup.querySelector("[data-review-panel]")) return true
  return Boolean(document.querySelector("[data-review-form]"))
}

type ReviewKeyboard = {
  /** Only listen while a receipt is open. */
  open: boolean
  step: (direction: 1 | -1) => void
  close: () => void
  /** Moving to another receipt clears the note about the last decision. */
  onMove: () => void
}

/** Up and down move between receipts, and Esc closes the panel. */
export function useReviewKeyboard({ open, step, close, onMove }: ReviewKeyboard) {
  // No dependency list on purpose: the handlers close over the current receipt.
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (keyBelongsElsewhere(event)) return
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault()
        onMove()
        step(event.key === "ArrowDown" ? 1 : -1)
      } else if (event.key === "Escape") {
        close()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  })
}
