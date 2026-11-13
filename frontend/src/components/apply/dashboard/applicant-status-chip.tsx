import type { DashboardTone } from "@/lib/apply/dashboard-state"
import { cn } from "@/lib/utils"

const chipClasses =
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill border px-2.5 py-1 font-mono text-xs leading-none"
const dotClasses = "size-1.5 rounded-full bg-current"
// Aquamarine only when the applicant has something to answer.
const toneClasses: Record<DashboardTone, string> = {
  action: "border-aquamarine/45 bg-aquamarine/10 text-aquamarine",
  positive: "border-biloba-flower/40 bg-biloba-flower/15 text-blue-chalk",
  neutral: "border-blue-chalk/20 bg-blue-chalk/5 text-prelude",
}

export function ApplicantStatusChip({ label, tone }: { label: string; tone: DashboardTone }) {
  return (
    <span className={cn(chipClasses, toneClasses[tone])}>
      <span className={dotClasses} aria-hidden />
      {label}
    </span>
  )
}
