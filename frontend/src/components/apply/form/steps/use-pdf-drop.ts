"use client"

import { useState, type DragEvent } from "react"
import {
  applicationDocumentPdfSizeLimitMessage,
  isApplicationDocumentPdfWithinSizeLimit,
} from "@/lib/apply/field-validation"

/**
 * What a PDF drop zone needs: whether a file is being dragged over it, why the
 * last file was turned away, and the handlers for the drop target and the input.
 */
export function usePdfDrop(onFile: (file: File | null) => void) {
  const [active, setActive] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  function takeFile(list: FileList | null) {
    const next = list?.[0]
    if (!next) return
    if (next.type !== "application/pdf") {
      setRejectReason("Only PDF files (.pdf) are accepted.")
      return
    }
    if (!isApplicationDocumentPdfWithinSizeLimit(next)) {
      setRejectReason(applicationDocumentPdfSizeLimitMessage())
      return
    }
    setRejectReason("")
    onFile(next)
  }

  const dropHandlers = {
    onDragOver(event: DragEvent) {
      event.preventDefault()
      setActive(true)
    },
    onDragLeave() {
      setActive(false)
    },
    onDrop(event: DragEvent) {
      event.preventDefault()
      setActive(false)
      takeFile(event.dataTransfer.files)
    },
  }

  return { active, rejectReason, takeFile, dropHandlers }
}
