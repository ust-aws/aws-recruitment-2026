import Image from "next/image"
import { MemberIdBarcode } from "@/components/apply/member-id-barcode"

// Night sky with the cloud wordmark, and the member ID as a barcode at the
// foot. Sizes are cqw of the card (the nearest @container), measured from the
// 1183px-wide design comp, so the face scales as one picture. The face fills
// its parent; the flip and shadow belong to whoever places it.
const backClasses =
  "absolute inset-0 overflow-hidden rounded-[1.7cqw] border-[0.4cqw] border-[#3f2794] bg-[#2a1670] text-white"
const backgroundClasses = "object-cover"
const logoClasses = "absolute left-1/2 top-[20.5%] h-auto w-[66cqw] -translate-x-1/2"
const footerClasses = "absolute inset-x-0 bottom-[6.5%] flex flex-col items-center gap-[1.5cqw]"
const barcodeClasses = "h-[13.3cqw] w-[54.7cqw]"
const memberIdClasses = "text-[2.6cqw] font-bold leading-none tracking-[0.02em] tabular-nums"

type MemberIdCardBackProps = {
  memberId: string
  /** Full-resolution, eagerly loaded artwork for saving the card as an image. */
  forExport?: boolean
}

export function MemberIdCardBack({ memberId, forExport = false }: MemberIdCardBackProps) {
  const loading = forExport ? "eager" : undefined

  return (
    <div className={backClasses}>
      <Image
        src="/member-id/back-bg.webp"
        alt=""
        fill
        sizes={forExport ? "1183px" : "24rem"}
        loading={loading}
        className={backgroundClasses}
      />
      <Image
        src="/member-id/back-logo.webp"
        alt="AWS Builders – UST"
        width={900}
        height={540}
        sizes={forExport ? "780px" : "16rem"}
        loading={loading}
        className={logoClasses}
      />
      <div className={footerClasses}>
        <MemberIdBarcode value={memberId} className={barcodeClasses} />
        <p className={memberIdClasses}>{memberId}</p>
      </div>
    </div>
  )
}
