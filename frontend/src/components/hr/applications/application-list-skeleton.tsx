import { Skeleton } from "@/components/ui/skeleton"
import { dashboardPanelClasses, dashboardDividerClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const listClasses = cn(dashboardPanelClasses, dashboardDividerClasses, "mt-6 overflow-hidden")
const rowClasses = "flex min-w-0 items-center gap-3 px-3 py-3"

export function ApplicationListSkeleton() {
  return (
    <ul
      className={listClasses}
      role="status"
      aria-busy="true"
      aria-label="Loading applications"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index} className={rowClasses}>
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <Skeleton className="hidden h-4 w-28 xl:block" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24 xl:hidden" />
          </div>
          <Skeleton className="hidden h-4 w-40 xl:block" />
          <Skeleton className="h-6 w-20 rounded-pill" />
        </li>
      ))}
    </ul>
  )
}
