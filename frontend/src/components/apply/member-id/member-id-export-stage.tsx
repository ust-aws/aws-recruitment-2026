import { useSyncExternalStore, type Ref } from "react"
import { createPortal } from "react-dom"
import { MemberIdCardBack } from "@/components/apply/member-id/member-id-card-back"
import { memberIdCardFont } from "@/components/apply/member-id/member-id-card-font"
import { MemberIdCardFront, type MemberIdCardFrontProps } from "@/components/apply/member-id/member-id-card-front"
import type { IdCardExportSide } from "@/lib/members/id-card-export"
import { cn } from "@/lib/utils"

// Off-screen, flat copy of the card at the comp's full 1183px width, mounted
// only while an image is being saved. No flip transform, so both faces read
// the right way round.
const stageClasses = "pointer-events-none fixed left-[-20000px] top-0"
const sheetClasses = "flex gap-[48px]"
const bothSheetClasses = "p-[48px]"
const faceClasses = "@container relative aspect-[1183/1664] w-[1183px]"

type MemberIdExportStageProps = {
  ref: Ref<HTMLDivElement>
  side: IdCardExportSide
  front: Omit<MemberIdCardFrontProps, "forExport">
}

// Nothing to subscribe to: the page body never changes once it exists.
const subscribeNever = () => () => {}

/** The page body in the browser, and null on the server, so rendering never reads `document` there. */
function usePageBody() {
  return useSyncExternalStore(subscribeNever, () => document.body, () => null)
}

export function MemberIdExportStage({ ref, side, front }: MemberIdExportStageProps) {
  const body = usePageBody()
  if (!body) return null

  return createPortal(
    <div className={stageClasses} aria-hidden inert>
      <div ref={ref} className={cn(sheetClasses, side === "both" && bothSheetClasses, memberIdCardFont.className)}>
        {side !== "back" ? (
          <div className={faceClasses}>
            <MemberIdCardFront {...front} forExport />
          </div>
        ) : null}
        {side !== "front" ? (
          <div className={faceClasses}>
            <MemberIdCardBack memberId={front.memberId} forExport />
          </div>
        ) : null}
      </div>
    </div>,
    body,
  )
}
