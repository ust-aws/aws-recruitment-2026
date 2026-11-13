"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

const buttonClasses = "gap-2 px-4"

type MemberIdSaveButtonProps = {
  pending: boolean
  onSave: () => void
}

export function MemberIdSaveButton({ pending, onSave }: MemberIdSaveButtonProps) {
  return (
    <Button type="button" color="purple" className={buttonClasses} disabled={pending} onClick={onSave}>
      <Download className="size-4" aria-hidden />
      {pending ? "Saving…" : "Save Image"}
    </Button>
  )
}
