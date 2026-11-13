"use client"

import { Download, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { dashboardActionTargetClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

// End-of-collection tools beside the tabs: export and the invitation retry.
const rowClasses = "grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center"
const wideOnlyClasses = "max-sm:hidden"
const iconClasses = "size-4 max-sm:hidden"
const actionClasses = cn("gap-1.5 px-2 sm:gap-2 sm:px-4", dashboardActionTargetClasses)
const exportClasses = cn(buttonVariants({ color: "purple" }), actionClasses)

export type CollectionRun = "retry-invitations"

type PaymentsCollectionActionsProps = {
  pending: boolean
  onRun: (kind: CollectionRun) => Promise<void>
}

export function PaymentsCollectionActions({ pending, onRun }: PaymentsCollectionActionsProps) {
  return (
    <div className={rowClasses}>
      <a href="/api/membership-payments/export" download className={exportClasses}>
        <Download className={iconClasses} aria-hidden />
        Export<span className={wideOnlyClasses}> Verified</span>
      </a>
      <Button
        type="button"
        color="purple"
        className={actionClasses}
        disabled={pending}
        onClick={() => void onRun("retry-invitations")}
      >
        <RotateCcw className={iconClasses} aria-hidden />
        Retry<span className={wideOnlyClasses}> Invitations</span>
      </Button>
    </div>
  )
}
