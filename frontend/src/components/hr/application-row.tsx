import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { StatusPill } from "@/components/hr/status-pill"
import { cn } from "@/lib/utils"
import { firstChoiceCommittee, fullName } from "@/lib/api"
import type { Application } from "@/lib/application-types"

const rowClasses =
  "glass flex items-center justify-between gap-4 rounded-pill border border-blue-chalk/20 bg-meteorite/40 px-5 py-3.5 transition-colors hover:border-biloba-flower/70"
const firstRowClasses = "border-biloba-flower/70"
const nameClasses = "font-sans text-base font-semibold text-blue-chalk"
const metaClasses = "flex items-center gap-3 font-sans text-sm text-prelude"

type ApplicationRowProps = {
  application: Application
  emphasized?: boolean
}

export function ApplicationRow({ application, emphasized }: ApplicationRowProps) {
  return (
    <Link
      href={`/admin/hr/${application.id}`}
      className={cn(rowClasses, emphasized && firstRowClasses)}
    >
      <span className={nameClasses}>{fullName(application)}</span>
      <span className={metaClasses}>
        <span>{firstChoiceCommittee(application)}</span>
        <StatusPill status={application.status} />
        <ChevronRight className="size-4 text-prelude" />
      </span>
    </Link>
  )
}
