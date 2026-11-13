"use client"

import { useRef } from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"

const buttonClasses = "gap-2 px-4"

type MemberPhotoButtonProps = {
  hasPhoto: boolean
  pending: boolean
  onChoosePhoto: (file: File) => void
}

export function MemberPhotoButton({ hasPhoto, pending, onChoosePhoto }: MemberPhotoButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onChoosePhoto(file)
          event.target.value = ""
        }}
      />
      <Button
        type="button"
        color="purple"
        className={buttonClasses}
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="size-4" aria-hidden />
        {pending ? "Uploading…" : hasPhoto ? "Change photo" : "Add photo"}
      </Button>
    </>
  )
}
