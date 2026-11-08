import { shortDate } from "@/lib/members/format"
import { UNPAID_FILTER_LABELS, type UnpaidEntry, type UnpaidStatus } from "@/lib/members/unpaid"
import { dashboardPanelClasses, dashboardRowTargetClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const wrapClasses = cn(dashboardPanelClasses, "min-w-0 overflow-hidden")
const tableClasses = "w-full border-collapse text-left max-xl:block"
const headCellClasses =
  "border-b border-blue-chalk/15 px-3 py-2.5 font-sans text-xs font-medium text-prelude"
const rowClasses =
  "border-b border-blue-chalk/10 last:border-b-0 hover:bg-blue-chalk/5 max-xl:grid max-xl:grid-cols-1 max-xl:gap-y-2 max-xl:px-4 max-xl:py-3"
const cellClasses = cn(
  dashboardRowTargetClasses,
  "px-3 py-2 align-middle font-sans text-sm text-blue-chalk max-xl:p-0"
)
const subLineClasses = "mt-0.5 block font-sans text-xs text-prelude"
const positionClampClasses = "block line-clamp-2"
const wideOnly = "max-xl:hidden"
const mutedClasses = "text-prelude"
const pillBase = "inline-flex w-fit items-center whitespace-nowrap rounded-pill border px-2.5 py-0.5 font-sans text-xs font-medium"
const pillByStatus: Record<UnpaidStatus, string> = {
  awaiting_payment: "border-prelude/50 text-blue-chalk",
  pending_verification: "border-biloba-flower/60 text-biloba-flower",
  needs_resubmission: "border-rose-glow/60 text-rose-glow",
  expired: "border-rose-glow/40 text-prelude",
}
const COLUMNS = ["Name", "Position", "Payment", "Deadline", "Last submission"]

/** An expired payment no longer has a "pay by": it says when it lapsed. */
function deadlineLabel(entry: UnpaidEntry) {
  return `${entry.status === "expired" ? "Expired" : "Pay by"} ${shortDate(entry.dueAt)}`
}

function StatusPill({ status }: { status: UnpaidStatus }) {
  return <span className={cn(pillBase, pillByStatus[status])}>{UNPAID_FILTER_LABELS[status]}</span>
}

function Row({ entry }: { entry: UnpaidEntry }) {
  return (
    <tr className={rowClasses}>
      <td className={cellClasses}>
        <span className="font-semibold">{entry.fullName}</span>
        <span className={subLineClasses}>
          <span className="xl:hidden">
            <span className={positionClampClasses}>{entry.position}</span>
            <span className="block">{deadlineLabel(entry)}</span>
          </span>
          <span className={wideOnly}>{entry.email}</span>
        </span>
      </td>
      <td className={cn(cellClasses, mutedClasses, wideOnly)}>{entry.position}</td>
      <td className={cn(cellClasses, "w-56 max-xl:w-auto")}>
        <StatusPill status={entry.status} />
      </td>
      <td className={cn(cellClasses, wideOnly)}>{deadlineLabel(entry)}</td>
      <td className={cn(cellClasses, mutedClasses, wideOnly)}>
        {entry.lastSubmittedAt ? `Sent ${shortDate(entry.lastSubmittedAt)}` : "Nothing sent"}
      </td>
    </tr>
  )
}

export function UnpaidTable({ entries }: { entries: UnpaidEntry[] }) {
  return (
    <div className={wrapClasses}>
      <table className={tableClasses}>
        <caption className="sr-only">Members who have not paid yet</caption>
        <thead className="max-xl:sr-only">
          <tr>
            {COLUMNS.map((label) => (
              <th key={label} scope="col" className={headCellClasses}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-xl:block">
          {entries.map((entry) => (
            <Row key={entry.key} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
