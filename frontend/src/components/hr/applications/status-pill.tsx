import { cva, type VariantProps } from "class-variance-authority"
import type { ApplicationStatus } from "@/lib/types/application"
import type { ApplicantListStatusTag } from "@/lib/hr/application-display"

const pill = cva(
  "inline-flex items-center rounded-pill px-2.5 py-0.5 font-sans text-xs font-medium",
  {
    variants: {
      status: {
        pending: "bg-biloba-flower/90 text-haiti",
        rejected: "border border-blue-chalk/25 bg-haiti/80 text-prelude",
        approved: "bg-aquamarine text-haiti",
        accepted: "bg-aquamarine text-haiti",
        redirected: "bg-daisy-bush/70 text-blue-chalk",
      },
    },
  }
)

const displayLabels: Record<
  ApplicationStatus | ApplicantListStatusTag,
  string
> = {
  pending: "Pending",
  rejected: "Rejected",
  approved: "Accepted",
  accepted: "Accepted",
  redirected: "Redirected",
}

export function StatusPill({
  status,
  className,
}: {
  status: ApplicationStatus | ApplicantListStatusTag
} & VariantProps<typeof pill> & { className?: string }) {
  const label = displayLabels[status] ?? status
  return <span className={pill({ status, className })}>{label}</span>
}
