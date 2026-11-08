import { MemberRolePill } from "@/components/hr/members/member-role-pill"
import type { MemberEntry } from "@/lib/members/directory"
import { shortDate } from "@/lib/members/format"
import { dashboardRowTargetClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const rowClasses =
  "border-b border-blue-chalk/10 last:border-b-0 hover:bg-blue-chalk/5 max-xl:grid max-xl:grid-cols-[minmax(0,1fr)_auto] max-xl:items-center max-xl:gap-x-3 max-xl:px-4 max-xl:py-3"
const cellClasses = cn(
  dashboardRowTargetClasses,
  "px-3 py-2 align-middle font-sans text-sm text-blue-chalk max-xl:p-0"
)
const idCellClasses = cn(cellClasses, "w-36 font-mono text-xs tabular-nums text-prelude max-xl:hidden")
const nameClasses = "font-semibold"
const subLineClasses = "mt-0.5 block font-sans text-xs text-prelude xl:hidden"
const subIdClasses = "block font-mono tabular-nums"
const subPositionClasses = "block line-clamp-2"
const nameCellClasses = cn(cellClasses, "xl:min-w-56")
const positionCellClasses = cn(cellClasses, "text-prelude max-xl:hidden")
const roleCellClasses = cn(cellClasses, "w-40 max-xl:w-auto")
const monoCellClasses = cn(cellClasses, "font-mono text-xs tabular-nums text-prelude max-[1399px]:hidden")
const statusCellClasses = cn(cellClasses, "w-44 max-xl:hidden")
const mutedClasses = "text-prelude"

function IdStatus({ entry }: { entry: MemberEntry }) {
  if (!entry.memberId) {
    const pendingLabel = entry.reservedMemberId
      ? `Reserved ${entry.reservedMemberId}`
      : entry.role === "ea"
        ? "Numbered at payment"
        : "No ID yet"
    return <span className={mutedClasses}>{pendingLabel}</span>
  }
  return (
    <span>
      Active
      {entry.issuedAt ? <span className={mutedClasses}> · issued {shortDate(entry.issuedAt)}</span> : null}
    </span>
  )
}

export function MemberTableRow({ entry }: { entry: MemberEntry }) {
  return (
    <tr className={rowClasses}>
      <td className={idCellClasses}>{entry.memberId ?? "—"}</td>
      <td className={nameCellClasses}>
        <span className={nameClasses}>{entry.fullName}</span>
        <span className={subLineClasses}>
          {entry.memberId ? <span className={subIdClasses}>{entry.memberId}</span> : null}
          <span className={subPositionClasses}>{entry.position}</span>
        </span>
      </td>
      <td className={positionCellClasses}>{entry.position}</td>
      <td className={roleCellClasses}>
        <MemberRolePill role={entry.role} />
      </td>
      <td className={monoCellClasses}>{entry.studentNumber ?? "—"}</td>
      <td className={monoCellClasses}>{entry.section ?? "—"}</td>
      <td className={statusCellClasses}>
        <IdStatus entry={entry} />
      </td>
    </tr>
  )
}
