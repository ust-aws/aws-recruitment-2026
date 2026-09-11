import { Skeleton } from "@/components/ui/skeleton"

const listClasses = "mt-8 flex flex-col gap-3"
const rowClasses =
  "glass flex items-center gap-3 rounded-pill border border-blue-chalk/20 bg-meteorite/40 px-5 py-3.5"

export function ApplicationListSkeleton() {
  return (
    <ul
      className={listClasses}
      role="status"
      aria-busy="true"
      aria-label="Loading applications"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index}>
          <div className={rowClasses}>
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="hidden h-4 w-32 sm:block" />
            <Skeleton className="h-6 w-20 rounded-pill" />
          </div>
        </li>
      ))}
    </ul>
  )
}
