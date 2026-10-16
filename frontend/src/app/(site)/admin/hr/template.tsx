import type { ReactNode } from "react"

const pageTransitionClasses =
  "dashboard-page-enter flex min-h-full w-full min-w-0 flex-1 flex-col"

export default function HrTemplate({ children }: { children: ReactNode }) {
  return <div className={pageTransitionClasses}>{children}</div>
}
