import { UserRound } from "lucide-react"
import Image from "next/image"
import { MemberIdCardDetails } from "@/components/apply/member-id/member-id-card-details"
import { MemberIdCardVerify } from "@/components/apply/member-id/member-id-card-verify"

// Official membership card: a purple frame with the org header, and a white
// panel holding the photo, the labelled details and the verify QR. Sizes are
// cqw of the card (the nearest @container), measured from the 1183px-wide
// design comp, so the face scales as one picture. The face fills its parent;
// the flip and shadow belong to whoever places it.
const frontClasses =
  "absolute inset-0 overflow-hidden rounded-[1.7cqw] bg-[linear-gradient(180deg,#35227b_0%,#6637ab_5%,#7e5fd7_10.5%,#7555d0_20%,#6438ab_55%,#5f33a4_75%,#3e2686_100%)] text-[#3b1f8d]"
// The strip under the panel catches light across, like a foil edge.
const footStripClasses =
  "absolute inset-x-0 bottom-0 h-[3.55cqw] bg-[linear-gradient(90deg,#37227f_0%,#6637ab_25%,#7a5bd3_58%,#563ca7_76%,#301a7c_100%)]"
const headerClasses = "absolute inset-x-0 top-0 flex h-[15.55cqw] items-center pl-[5.2cqw] pr-[6.6cqw]"
const logoClasses = "h-auto w-[11.7cqw] shrink-0"
const orgClasses =
  "ml-[2.5cqw] whitespace-nowrap text-[4cqw] font-extrabold leading-none tracking-[-0.01em] text-white"
const ayClasses =
  "ml-auto flex h-[5.4cqw] items-center whitespace-nowrap rounded-full bg-white px-[2.4cqw] text-[2.5cqw] font-extrabold leading-none"
// The verify block sits on the panel's foot, so long rows can never push it out.
const panelClasses =
  "absolute inset-x-[3.55cqw] bottom-[3.55cqw] top-[15.55cqw] flex flex-col items-center bg-white pb-[8.6cqw]"
const titleClasses = "mt-[3.4cqw] text-[5.15cqw] font-extrabold leading-none tracking-[-0.01em]"
const ruleClasses = "mt-[3.6cqw] w-[59cqw] border-t border-[#3b3165]"
const photoFrameClasses =
  "mt-[2.2cqw] grid size-[33.3cqw] shrink-0 place-items-center overflow-hidden rounded-[2.5cqw] border-[0.45cqw] border-[#412593] bg-[#efeaff]"
const photoClasses = "size-full object-cover"
const photoPlaceholderClasses = "size-[12cqw] text-[#8a76b8]"
const detailsClasses = "mt-[1.4cqw]"
const verifyClasses = "mt-auto pt-[3cqw]"

export type MemberIdCardFrontProps = {
  fullName: string
  studentNumber: string
  section: string
  position: string
  memberId: string
  academicYear: string
  issuedOn: string
  validThrough: string
  photoUrl: string | null
  /** Full-resolution, eagerly loaded artwork for saving the card as an image. */
  forExport?: boolean
}

export function MemberIdCardFront({
  fullName,
  studentNumber,
  section,
  position,
  memberId,
  academicYear,
  issuedOn,
  validThrough,
  photoUrl,
  forExport = false,
}: MemberIdCardFrontProps) {
  return (
    <div className={frontClasses}>
      <span className={footStripClasses} aria-hidden />
      <div className={headerClasses}>
        <Image
          src="/member-id/front-logo.webp"
          alt=""
          width={360}
          height={287}
          sizes={forExport ? "280px" : "4rem"}
          loading={forExport ? "eager" : undefined}
          className={logoClasses}
        />
        <p className={orgClasses}>AWS BUILDERS – UST</p>
        <p className={ayClasses}>AY. {academicYear}</p>
      </div>
      <div className={panelClasses}>
        <p className={titleClasses}>OFFICIAL MEMBERSHIP CARD</p>
        <span className={ruleClasses} aria-hidden />
        <div className={photoFrameClasses}>
          {photoUrl ? (
            // Signed S3 URLs are dynamic, so next/image cannot optimize them.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} alt={fullName} className={photoClasses} />
          ) : (
            <UserRound className={photoPlaceholderClasses} aria-hidden />
          )}
        </div>
        <div className={detailsClasses}>
          <MemberIdCardDetails
            fullName={fullName}
            studentNumber={studentNumber}
            position={position}
            section={section}
            memberId={memberId}
          />
        </div>
        <div className={verifyClasses}>
          <MemberIdCardVerify memberId={memberId} issuedOn={issuedOn} validThrough={validThrough} />
        </div>
      </div>
    </div>
  )
}
