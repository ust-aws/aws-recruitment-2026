import Link from "next/link"
import { Archive, ChevronRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/hr/status-pill"
import { cn } from "@/lib/utils"
import { firstChoiceCommittee, fullName } from "@/lib/api"
import type { HrApplication } from "@/lib/hr-application-types"

const rowClasses =
  "glass flex items-center gap-3 rounded-pill border border-blue-chalk/20 bg-meteorite/40 px-5 py-3.5 transition-colors hover:border-biloba-flower/70"
const firstRowClasses = "border-biloba-flower/70"
const linkClasses = "flex min-w-0 flex-1 items-center justify-between gap-4"
const nameBlockClasses = "flex flex-col gap-0.5"
const nameClasses = "font-sans text-base font-semibold text-blue-chalk"
const codeClasses = "font-mono text-xs text-prelude"
const metaClasses = "flex items-center gap-3 font-sans text-sm text-prelude"
const actionIconClasses = "size-4"
const archiveIconButtonClasses =
  "size-8 shrink-0 rounded-full border-biloba-flower/45 bg-daisy-bush/25 text-biloba-flower hover:border-biloba-flower/70 hover:bg-daisy-bush/45 hover:text-blue-chalk"
const restoreIconButtonClasses =
  "size-8 shrink-0 rounded-full border-aquamarine/45 bg-aquamarine/10 text-aquamarine hover:border-aquamarine/70 hover:bg-aquamarine/20 hover:text-blue-chalk"
const archivedClasses =
  "rounded-pill bg-daisy-bush/55 px-3 py-0.5 font-mono text-[11px] text-blue-chalk"

type ApplicationRowProps = {
  application: HrApplication
  emphasized?: boolean
  onArchive: (application: HrApplication) => void
}

export function ApplicationRow({
  application,
  emphasized,
  onArchive,
}: ApplicationRowProps) {
  const name = fullName(application)
  const archived = Boolean(application.archivedAt)

  return (
    <div className={cn(rowClasses, emphasized && firstRowClasses)}>
      <Button
        type="button"
        color={archived ? "cyan" : "purple"}
        variant="ghost"
        size="icon-sm"
        className={
          archived ? restoreIconButtonClasses : archiveIconButtonClasses
        }
        aria-label={archived ? `Restore ${name}` : `Archive ${name}`}
        onClick={() => onArchive(application)}
      >
        {archived ? (
          <RotateCcw className={actionIconClasses} />
        ) : (
          <Archive className={actionIconClasses} />
        )}
      </Button>
      <Link href={`/admin/hr/${application.id}`} className={linkClasses}>
        <div className={nameBlockClasses}>
          <span className={nameClasses}>{name}</span>
          <span className={codeClasses}>{application.applicationCode}</span>
        </div>
        <span className={metaClasses}>
          <span>{firstChoiceCommittee(application)}</span>
          {archived ? <span className={archivedClasses}>Archived</span> : null}
          <StatusPill status={application.status} />
          <ChevronRight className="size-4 text-prelude" />
        </span>
      </Link>
    </div>
  )
}
