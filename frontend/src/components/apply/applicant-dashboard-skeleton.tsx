import { Skeleton } from "@/components/ui/skeleton"
import { glassPanelClasses } from "@/lib/surface"

const panelClasses = `${glassPanelClasses} mt-8 px-6 py-8 md:px-10`
const metaRowClasses = "mt-6 flex flex-wrap gap-x-8 gap-y-3"

export function ApplicantDashboardSkeleton() {
  return (
    <section
      className={panelClasses}
      role="status"
      aria-busy="true"
      aria-label="Loading your application"
    >
      <Skeleton className="h-10 w-64 max-w-full md:h-12" />
      <Skeleton className="mt-2 h-4 w-32" />
      <Skeleton className="mt-6 h-14 w-full rounded-[14px]" />
      <div className={metaRowClasses}>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-4 w-36" />
        ))}
      </div>
      <Skeleton className="mt-8 h-4 w-48" />
      <Skeleton className="mt-2 h-20 w-full rounded-[14px]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-28 rounded-[14px]" />
        <Skeleton className="h-28 rounded-[14px]" />
      </div>
      <Skeleton className="mt-8 h-48 w-full rounded-[20px]" />
    </section>
  )
}
