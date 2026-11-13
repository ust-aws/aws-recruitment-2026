import { Skeleton } from "@/components/ui/skeleton"

const formClasses = "mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
const fieldBlockClasses = "flex flex-col gap-2"

export function DatetimeFieldsSkeleton() {
  return (
    <div
      className={formClasses}
      role="status"
      aria-busy="true"
      aria-label="Loading dates"
    >
      <div className={fieldBlockClasses}>
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-11 w-full rounded-[14px]" />
      </div>
      <div className={fieldBlockClasses}>
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-11 w-full rounded-[14px]" />
      </div>
      <Skeleton className="h-11 w-28 rounded-pill md:self-end" />
    </div>
  )
}
