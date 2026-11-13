import { MemberTableRow } from "@/components/hr/members/member-table-row"
import type { MemberEntry } from "@/lib/members/directory"
import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const wrapClasses = cn(dashboardPanelClasses, "min-w-0 overflow-hidden")
const tableClasses = "w-full border-collapse text-left max-xl:block"
const headClasses = "max-xl:sr-only"
const headCellClasses =
  "border-b border-blue-chalk/15 px-3 py-2.5 font-sans text-xs font-medium text-prelude"
const COLUMNS = [
  { label: "Member ID" },
  { label: "Name" },
  { label: "Position" },
  { label: "Role" },
  { label: "Student No.", className: "max-[1399px]:hidden" },
  { label: "Section", className: "max-[1399px]:hidden" },
  { label: "ID status" },
]

export function MemberTable({ entries }: { entries: MemberEntry[] }) {
  return (
    <div className={wrapClasses}>
      <table className={tableClasses}>
        <caption className="sr-only">Members</caption>
        <thead className={headClasses}>
          <tr>
            {COLUMNS.map(({ label, className }) => (
              <th key={label} scope="col" className={cn(headCellClasses, className)}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="max-xl:block">
          {entries.map((entry) => (
            <MemberTableRow key={entry.key} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
