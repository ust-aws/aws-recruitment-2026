"use client"

import { useSyncExternalStore } from "react"
import { QRCodeSVG } from "qrcode.react"

// QR to the public verify page, with the issue and expiry lines beside it.
const verifyClasses = "flex items-center gap-[1.7cqw]"
const qrClasses = "size-[12.4cqw] shrink-0"
const qrPlaceholderClasses = "size-[12.4cqw] shrink-0 rounded-[0.6cqw] bg-[#3b1f8d]/10"
const headingClasses = "text-[2.7cqw] font-bold leading-tight"
const issuedClasses = "text-[2.25cqw] italic leading-tight text-[#8a76b8]"
const validClasses = "text-[2.1cqw] font-extrabold uppercase leading-tight"

// The QR points at the public site. NEXT_PUBLIC_SITE_URL pins it, so a card
// made on a dev machine or a preview deploy still scans to the real site;
// without it the QR uses the address the page was opened on.
const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") || null
const subscribeToNothing = () => () => {}
const browserOrigin = () => configuredSiteUrl ?? window.location.origin
const serverOrigin = () => configuredSiteUrl

type MemberIdCardVerifyProps = {
  memberId: string
  issuedOn: string
  validThrough: string
}

export function MemberIdCardVerify({ memberId, issuedOn, validThrough }: MemberIdCardVerifyProps) {
  const origin = useSyncExternalStore(subscribeToNothing, browserOrigin, serverOrigin)

  return (
    <div className={verifyClasses}>
      {origin ? (
        <QRCodeSVG
          value={`${origin}/verify/${memberId}`}
          size={128}
          level="M"
          bgColor="#ffffff"
          fgColor="#3b1f8d"
          className={qrClasses}
          title="Scan to verify this membership"
        />
      ) : (
        <span className={qrPlaceholderClasses} aria-hidden />
      )}
      <div className="min-w-0">
        <p className={headingClasses}>Scan to verify membership</p>
        <p className={issuedClasses}>{issuedOn}</p>
        <p className={validClasses}>Valid through {validThrough}</p>
      </div>
    </div>
  )
}
