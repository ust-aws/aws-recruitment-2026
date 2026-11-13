import { idCardValueSize, type IdCardValueSize } from "@/lib/members/id-card"
import { cn } from "@/lib/utils"

// Label pill on the left, value centred in the rest of the row, a thin rule
// under each row. Sizes are cqw of the card, taken from the design comp.
const listClasses = "w-[70.8cqw]"
const rowClasses =
  "grid min-h-[9.4cqw] grid-cols-[17cqw_1fr] items-center border-b border-[#4a3f6a] py-[1cqw]"
const pillClasses =
  "flex h-[2.9cqw] items-center justify-self-start whitespace-nowrap rounded-full bg-[linear-gradient(180deg,#7f5fdc_0%,#6837ab_55%,#2d1a6b_100%)] px-[2cqw] text-[2.5cqw] font-extrabold leading-none text-white"
const valueClasses = "line-clamp-2 break-words pr-[4cqw] text-center leading-[1.2] text-balance"
const valueSizeClasses: Record<IdCardValueSize, string> = {
  lg: "text-[4.15cqw]",
  md: "text-[3.5cqw]",
  sm: "text-[3cqw]",
  xs: "text-[2.6cqw]",
}

type MemberIdCardDetailsProps = {
  fullName: string
  studentNumber: string
  position: string
  section: string
  memberId: string
}

function Row({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={rowClasses}>
      <dt className={pillClasses}>{label}</dt>
      <dd className={cn(valueClasses, valueSizeClasses[idCardValueSize(value)], bold && "font-bold")}>{value}</dd>
    </div>
  )
}

export function MemberIdCardDetails({ fullName, studentNumber, position, section, memberId }: MemberIdCardDetailsProps) {
  return (
    <dl className={listClasses}>
      <Row label="NAME" value={fullName} />
      <Row label="STUD NO." value={studentNumber} />
      <Row label="POSITION" value={position} />
      <Row label="YEAR & SEC." value={section} />
      <Row label="MEMBER ID" value={memberId} bold />
    </dl>
  )
}
