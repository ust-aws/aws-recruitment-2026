import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  dashboardDividerClasses,
  dashboardPanelClasses,
} from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

const skeletonListClasses = cn(dashboardPanelClasses, dashboardDividerClasses, "mt-6 overflow-hidden")
const skeletonRowClasses = "flex items-center gap-4 px-4 py-4"
const messageClasses = cn(dashboardPanelClasses, "mt-6 flex flex-col items-start gap-3 px-5 py-5")
const titleClasses = "font-sans text-base font-semibold text-blue-chalk"
const bodyClasses = "font-sans text-sm text-prelude"
const errorClasses = cn(messageClasses, "border-rose-glow/40")
const buttonClasses = "h-11 px-5 font-mono text-xs"

export function MembersSkeleton() {
  return (
    <ul className={skeletonListClasses} role="status" aria-busy="true" aria-label="Loading members">
      {Array.from({ length: 8 }, (_, index) => (
        <li key={index} className={skeletonRowClasses}>
          <Skeleton className="hidden h-4 w-28 xl:block" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="ml-auto h-6 w-24 rounded-pill" />
        </li>
      ))}
    </ul>
  )
}

export function MembersMessage({
  title,
  body,
  linkHref,
  linkLabel,
}: {
  title: string
  body: string
  linkHref?: string
  linkLabel?: string
}) {
  return (
    <div className={messageClasses}>
      <p className={titleClasses}>{title}</p>
      <p className={bodyClasses}>{body}</p>
      {linkHref && linkLabel ? (
        <Button color="purple" className={buttonClasses} nativeButton={false} render={<Link href={linkHref} />}>
          {linkLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function MembersError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={errorClasses} role="alert">
      <p className={titleClasses}>Could not load the members</p>
      <p className={bodyClasses}>{message}</p>
      <Button color="purple" className={buttonClasses} onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
