import type { ReactNode } from "react"
import { BadgeCheck, CircleAlert, CircleX } from "lucide-react"
import Image from "next/image"
import type { MemberVerificationResult } from "@/lib/members/verify-server"
import { glassPanelClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"

const cardClasses = `${glassPanelClasses} flex w-full max-w-md flex-col items-center px-6 py-8 text-center`
const espiClasses = "h-auto w-32"
const eyebrowClasses = "mt-4 font-mono text-xs tracking-[0.16em] text-prelude"
const statusBaseClasses =
  "mt-3 inline-flex items-center gap-2 rounded-pill border px-4 py-1.5 font-sans text-sm font-semibold"
const statusTone = {
  active: "border-aquamarine/50 bg-aquamarine/15 text-aquamarine",
  inactive: "border-rose-blush/50 bg-rose-deep/40 text-rose-glow",
  missing: "border-blue-chalk/25 bg-haiti/50 text-blue-chalk",
} as const
const nameClasses = "mt-5 font-sans text-2xl font-bold text-blue-chalk text-balance"
const positionClasses = "mt-1 font-sans text-sm text-prelude text-balance"
const detailsClasses = "mt-5 grid w-full grid-cols-2 gap-3 rounded-[16px] bg-haiti/55 px-4 py-3"
const labelClasses = "font-mono text-[10px] tracking-[0.14em] text-prelude"
const valueClasses = "mt-0.5 font-mono text-sm font-semibold text-blue-chalk"
const noteClasses = "mt-5 font-sans text-xs leading-relaxed text-prelude"

function Status({ tone, children }: { tone: keyof typeof statusTone; children: ReactNode }) {
  return <p className={cn(statusBaseClasses, statusTone[tone])}>{children}</p>
}

/** What someone sees after scanning the QR on a member's digital ID. */
export function MemberVerificationCard({
  memberId,
  result,
}: {
  memberId: string
  result: MemberVerificationResult
}) {
  return (
    <section className={cardClasses} aria-labelledby="verify-title">
      <Image src="/espi.webp" alt="" width={1080} height={1080} className={espiClasses} />
      <p id="verify-title" className={eyebrowClasses}>
        AWS BUILDERS – UST · MEMBER CHECK
      </p>
      {result.kind === "found" ? (
        <>
          {result.member.status === "active" ? (
            <Status tone="active">
              <BadgeCheck className="size-4" aria-hidden /> Active member
            </Status>
          ) : (
            <Status tone="inactive">
              <CircleX className="size-4" aria-hidden /> Not an active member
            </Status>
          )}
          <p className={nameClasses}>{result.member.fullName}</p>
          <p className={positionClasses}>{result.member.position}</p>
          <dl className={detailsClasses}>
            <div>
              <dt className={labelClasses}>MEMBER ID</dt>
              <dd className={valueClasses}>{result.member.memberId}</dd>
            </div>
            <div>
              <dt className={labelClasses}>A.Y.</dt>
              <dd className={valueClasses}>{result.member.academicYear}</dd>
            </div>
          </dl>
          <p className={noteClasses}>Checked just now against the AWS Builders – UST membership list.</p>
        </>
      ) : result.kind === "not-found" ? (
        <>
          <Status tone="missing">
            <CircleAlert className="size-4" aria-hidden /> No member with this ID
          </Status>
          <p className={noteClasses}>
            {memberId} is not on the membership list. Check that the whole QR code was scanned.
          </p>
        </>
      ) : (
        <>
          <Status tone="missing">
            <CircleAlert className="size-4" aria-hidden /> Could not check right now
          </Status>
          <p className={noteClasses}>The membership list did not respond. Try scanning again in a moment.</p>
        </>
      )}
    </section>
  )
}
