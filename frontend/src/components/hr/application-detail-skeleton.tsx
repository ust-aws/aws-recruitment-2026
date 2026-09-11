import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { glassPanelClasses, pageShellClasses } from "@/lib/surface"

const backClasses =
  "mb-3 mt-3 inline-flex font-mono text-xs text-prelude hover:text-blue-chalk"
const panelClasses = `${glassPanelClasses} mt-8 px-6 py-8 md:px-10`
const metaRowClasses = "flex flex-wrap gap-x-8 gap-y-3"

export function HrApplicationDetailSkeleton() {
  return (
    <main
      className={pageShellClasses}
      role="status"
      aria-busy="true"
      aria-label="Loading application"
    >
      <Skeleton className="h-3 w-28" />
      <Link href="/admin/hr" className={backClasses}>
        ← Back to Applications
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Skeleton className="h-12 w-72 max-w-full md:h-14" />
        <Skeleton className="h-8 w-24 rounded-pill" />
      </div>
      <div className={panelClasses}>
        <div className={metaRowClasses}>
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-40" />
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24 rounded-[14px]" />
          <Skeleton className="h-24 rounded-[14px]" />
        </div>
        <Skeleton className="mt-8 h-4 w-56" />
        <Skeleton className="mt-2 h-16 w-full rounded-[14px]" />
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Skeleton className="h-10 w-36 rounded-pill" />
          <Skeleton className="h-10 w-36 rounded-pill" />
          <Skeleton className="h-10 w-40 rounded-pill" />
        </div>
        <Skeleton className="mx-auto mt-8 h-9 w-64 rounded-pill" />
      </div>
    </main>
  )
}
