"use client"

import { useState } from "react"
import { RotateCw } from "lucide-react"
import { MemberIdCardBack } from "@/components/apply/member-id/member-id-card-back"
import { memberIdCardFont } from "@/components/apply/member-id/member-id-card-font"
import { MemberIdCardFront, type MemberIdCardFrontProps } from "@/components/apply/member-id/member-id-card-front"
import { MemberIdExportStage } from "@/components/apply/member-id/member-id-export-stage"
import { MemberIdSaveButton } from "@/components/apply/member-id/member-id-save-button"
import { MemberPhotoButton } from "@/components/apply/member-id/member-photo-button"
import { MemberPhotoCropDialog } from "@/components/apply/member-id/member-photo-crop-dialog"
import { useMemberIdExport } from "@/components/apply/member-id/use-member-id-export"
import { useMemberPhotoUpload } from "@/components/apply/member-id/use-member-photo-upload"
import { Button } from "@/components/ui/button"
import type { MemberCard } from "@/lib/api/applicant"
import { academicYearLabel, issuedOnLabel, validThroughLabel } from "@/lib/members/id-card"
import { cn } from "@/lib/utils"

const wrapperClasses = "flex flex-col items-center gap-4"
// The design comp's proportions (1183 x 1664). The scene is the size
// container: both faces size everything in cqw so they scale as one picture.
const sceneClasses = "@container relative aspect-[1183/1664] w-[24rem] max-w-full perspective-distant"
const flipperBaseClasses =
  "relative size-full transition-transform duration-700 ease-in-out transform-3d motion-reduce:transition-none"
const flippedClasses = "rotate-y-180"
const faceSlotClasses = "absolute inset-0 rounded-[1.7cqw] shadow-xl backface-hidden"
const backSlotClasses = "rotate-y-180"
// Invisible click target over the whole card, so a mouse click anywhere flips it.
const flipOverlayClasses = "absolute inset-0 z-10 cursor-pointer rounded-[1.7cqw] outline-none"
const flipButtonClasses = "gap-2 px-4"
const actionsClasses = "flex flex-wrap items-center justify-center gap-3"
const errorClasses = "text-center font-sans text-xs text-rose-glow"

type MemberIdCardProps = {
  card: MemberCard
  firstName: string
  lastName: string
  studentNumber: string | null
  section: string | null
  onCardChange: (card: MemberCard) => void
}

export function MemberIdCard({
  card,
  firstName,
  lastName,
  studentNumber,
  section,
  onCardChange,
}: MemberIdCardProps) {
  const [flipped, setFlipped] = useState(false)
  const [chosenPhoto, setChosenPhoto] = useState<{ src: string; name: string } | null>(null)
  const photo = useMemberPhotoUpload(onCardChange)
  const { stageRef, job: exportJob, pending: saving, error: saveError, save } = useMemberIdExport(
    card.memberId,
    card.photoUrl,
  )
  const front: Omit<MemberIdCardFrontProps, "forExport"> = {
    fullName: `${firstName} ${lastName}`,
    studentNumber: studentNumber ?? "—",
    section: section ?? "—",
    position: card.position,
    memberId: card.memberId,
    academicYear: academicYearLabel(card.recruitmentYear),
    issuedOn: issuedOnLabel(card.issuedAt),
    validThrough: validThroughLabel(card.recruitmentYear),
    photoUrl: card.photoUrl,
  }
  const error = photo.error ?? saveError

  function closeCrop() {
    if (chosenPhoto) URL.revokeObjectURL(chosenPhoto.src)
    setChosenPhoto(null)
  }

  return (
    <div className={wrapperClasses}>
      <div className={cn(sceneClasses, memberIdCardFont.className)}>
        <div className={cn(flipperBaseClasses, flipped && flippedClasses)}>
          <div className={faceSlotClasses}>
            <MemberIdCardFront {...front} />
          </div>
          <div className={cn(faceSlotClasses, backSlotClasses)}>
            <MemberIdCardBack memberId={card.memberId} />
          </div>
        </div>
        {/* Mouse shortcut only: the Show back button below is the keyboard and
            screen-reader control, so this stays out of the tab order. */}
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          className={flipOverlayClasses}
          onClick={() => setFlipped((current) => !current)}
        />
      </div>
      <div className={actionsClasses}>
        <MemberPhotoButton
          hasPhoto={card.photoUrl !== null}
          pending={photo.pending}
          onChoosePhoto={(file) => setChosenPhoto({ src: URL.createObjectURL(file), name: file.name })}
        />
        <Button
          type="button"
          color="purple"
          className={flipButtonClasses}
          aria-pressed={flipped}
          onClick={() => setFlipped((current) => !current)}
        >
          <RotateCw className="size-4" aria-hidden />
          {flipped ? "Show front" : "Show back"}
        </Button>
        <MemberIdSaveButton pending={saving} onSave={() => void save()} />
      </div>
      {error ? <p className={errorClasses} role="alert">{error}</p> : null}
      {exportJob ? (
        <MemberIdExportStage
          ref={stageRef}
          side={exportJob.side}
          front={{ ...front, photoUrl: exportJob.photoUrl }}
        />
      ) : null}
      {chosenPhoto ? (
        <MemberPhotoCropDialog
          imageSrc={chosenPhoto.src}
          fileName={chosenPhoto.name}
          onCancel={closeCrop}
          onCropped={(file) => {
            closeCrop()
            void photo.upload(file)
          }}
        />
      ) : null}
    </div>
  )
}
