import { SectionHeader } from "@/components/section-header"
import { Skeleton } from "@/components/ui/skeleton"

const shellClasses = "relative flex flex-col gap-8"
const boardClasses =
  "glass relative grid min-h-[min(72vh,46rem)] overflow-hidden rounded-[28px] border border-blue-chalk/20 bg-haiti/30 lg:grid-cols-[minmax(0,23rem)_1fr]"
const listPaneClasses =
  "panel-scroll flex flex-col gap-3 border-blue-chalk/15 p-4 lg:border-r"
const detailPaneClasses = "flex flex-col gap-4 p-6 md:p-8"

export function PositionsBrowserSkeleton() {
  return (
    <div
      className={shellClasses}
      role="status"
      aria-busy="true"
      aria-label="Loading open positions"
    >
      <SectionHeader
        eyebrow="$ ls positions/"
        title="Find a role that fits."
        subtitle="Browse open executive assistant and committee staff roles."
      />
      <Skeleton className="h-3 w-48" />
      <div className={boardClasses}>
        <div className={listPaneClasses}>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-[14px]" />
          ))}
        </div>
        <div className={detailPaneClasses}>
          <Skeleton className="h-8 w-[75%] max-w-md" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-32 w-full rounded-[14px]" />
        </div>
      </div>
    </div>
  )
}
