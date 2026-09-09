import Link from "next/link"
import { ChevronRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/hr/status-pill"
import { cn } from "@/lib/utils"
import { firstChoiceCommittee, fullName } from "@/lib/api"
import { deleteIconButtonClasses } from "@/lib/delete-button-classes"
import type { Application } from "@/lib/application-types"

const rowClasses =
  "glass flex items-center gap-3 rounded-pill border border-blue-chalk/20 bg-meteorite/40 px-5 py-3.5 transition-colors hover:border-biloba-flower/70"
const firstRowClasses = "border-biloba-flower/70"
const linkClasses = "flex min-w-0 flex-1 items-center justify-between gap-4"
const nameBlockClasses = "flex flex-col gap-0.5"
const nameClasses = "font-sans text-base font-semibold text-blue-chalk"
const codeClasses = "font-mono text-xs text-prelude"
const metaClasses = "flex items-center gap-3 font-sans text-sm text-prelude"
const deleteIconClasses = "size-4"

type ApplicationRowProps = {
  application: Application
  emphasized?: boolean
  onDelete: (application: Application) => void
}

export function ApplicationRow({
  application,
  emphasized,
  onDelete,
}: ApplicationRowProps) {
  const name = fullName(application)

  return (
    <div className={cn(rowClasses, emphasized && firstRowClasses)}>
      <Button
        type="button"
        color="danger"
        variant="ghost"
        size="icon-sm"
        className={deleteIconButtonClasses}
        aria-label={`Delete ${name}`}
        onClick={() => onDelete(application)}
      >
        <Trash2 className={deleteIconClasses} />
      </Button>
      <Link href={`/admin/hr/${application.id}`} className={linkClasses}>
        <div className={nameBlockClasses}>
          <span className={nameClasses}>{name}</span>
          <span className={codeClasses}>{application.applicationCode}</span>
        </div>
        <span className={metaClasses}>
          <span>{firstChoiceCommittee(application)}</span>
          <StatusPill status={application.status} />
          <ChevronRight className="size-4 text-prelude" />
        </span>
      </Link>
    </div>
  )
}
