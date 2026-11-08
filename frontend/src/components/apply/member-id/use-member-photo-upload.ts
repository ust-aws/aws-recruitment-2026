"use client"

import { useState } from "react"
import {
  completeMemberPhotoUpload,
  createMemberPhotoUpload,
  type MemberCard,
} from "@/lib/api/applicant"
import { fileChecksum } from "@/lib/apply/document-upload"

const PHOTO_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const MAX_PHOTO_BYTES = 5_000_000

type PhotoMimeType = (typeof PHOTO_MIME_TYPES)[number]

function isPhotoMimeType(value: string): value is PhotoMimeType {
  return (PHOTO_MIME_TYPES as readonly string[]).includes(value)
}

/** Uploads a new ID photo and hands back the refreshed member card. */
export function useMemberPhotoUpload(onUploaded: (card: MemberCard) => void) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")

  async function upload(file: File) {
    setError("")
    if (!isPhotoMimeType(file.type)) {
      setError("Photo must be a JPEG, PNG, or WebP image.")
      return
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("Photo must be 5 MB or smaller.")
      return
    }
    setPending(true)
    try {
      const metadata = {
        mimeType: file.type,
        sizeBytes: file.size,
        checksumSha256: await fileChecksum(file),
      }
      const signed = await createMemberPhotoUpload(metadata)
      const form = new FormData()
      Object.entries(signed.fields).forEach(([name, value]) =>
        form.append(name, value),
      )
      form.append("file", file)
      const response = await fetch(signed.url, { method: "POST", body: form })
      if (!response.ok) throw new Error("Could not upload your photo.")
      const { memberCard } = await completeMemberPhotoUpload({
        ...metadata,
        key: signed.key,
      })
      if (memberCard) onUploaded(memberCard)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not upload your photo.")
    } finally {
      setPending(false)
    }
  }

  return { upload, pending, error }
}
