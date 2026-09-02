import { cva, type VariantProps } from "class-variance-authority"
import type { ApplicationStatus } from "@/lib/application-types"

const pill = cva(
  "inline-flex items-center rounded-pill px-3 py-0.5 font-mono text-[11px] capitalize",
  {
    variants: {
      status: {
        pending: "bg-biloba-flower/90 text-haiti",
        rejected: "bg-haiti/80 text-prelude",
        approved: "bg-aquamarine text-haiti",
      },
    },
  }
)

export function StatusPill({
  status,
  className,
}: {
  status: ApplicationStatus
} & VariantProps<typeof pill> & { className?: string }) {
  return <span className={pill({ status, className })}>{status}</span>
}
