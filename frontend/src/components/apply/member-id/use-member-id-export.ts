"use client"

import { useEffect, useRef, useState } from "react"
import { downloadBlob } from "@/lib/members/download"
import {
  captureIdCard,
  idCardFileName,
  photoAsDataUrl,
  type IdCardExportSide,
} from "@/lib/members/id-card-export"

type ExportJob = { side: IdCardExportSide; photoUrl: string | null }

/**
 * Saves the member ID as two PNGs (front, then back): mounts the off-screen
 * stage for each side, captures it, downloads it, then unmounts the stage.
 */
export function useMemberIdExport(memberId: string, photoUrl: string | null) {
  const stageRef = useRef<HTMLDivElement>(null)
  // Resolved once React has put the stage for the current job on the page.
  const stageReady = useRef<(() => void) | null>(null)
  const [job, setJob] = useState<ExportJob | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!job) return
    stageReady.current?.()
    stageReady.current = null
  }, [job])

  async function saveSide(side: IdCardExportSide) {
    const inlinedPhoto = photoUrl && side !== "back" ? await photoAsDataUrl(photoUrl) : null
    // Show the stage, then wait for React to commit it so its node exists for the capture.
    const mounted = new Promise<void>((resolve) => {
      stageReady.current = resolve
    })
    setJob({ side, photoUrl: inlinedPhoto })
    await mounted
    const node = stageRef.current
    if (!node) throw new Error("The card is not ready.")
    downloadBlob(idCardFileName(memberId, side), await captureIdCard(node))
    return !photoUrl || side === "back" || Boolean(inlinedPhoto)
  }

  /** Downloads the front and the back as two separate images. */
  async function save() {
    if (pending) return
    setPending(true)
    setError(null)
    try {
      const frontHadPhoto = await saveSide("front")
      await saveSide("back")
      if (!frontHadPhoto) {
        setError("Saved without your photo because it could not be loaded. Try again in a moment.")
      }
    } catch {
      setError("The image could not be saved. Try again.")
    } finally {
      setJob(null)
      setPending(false)
    }
  }

  return { stageRef, job, pending, error, save }
}
