import { Button } from "@/components/ui/button"
import type { ResultsPreview } from "@/lib/api/client"
import { formatSubheaderLabel } from "@/lib/site/button-label"
import { glassPanelClasses, subheaderLabelClasses } from "@/lib/site/surface"

const summaryGridClasses = "grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6"
const summaryCardClasses = `${glassPanelClasses} rounded-[20px] px-5 py-4`
const valueClasses = "mt-2 font-sans text-3xl font-bold text-blue-chalk"
const actionPanelClasses = `${glassPanelClasses} mt-4 flex flex-col gap-4 rounded-[20px] px-5 py-5 lg:flex-row lg:items-center lg:justify-between`
const actionCopyClasses = "max-w-3xl font-sans text-sm leading-relaxed text-prelude"
const actionButtonsClasses = "flex flex-wrap gap-3"

type Props = {
  summary: ResultsPreview["summary"]
  pendingAction: "release" | "retry" | null
  onRelease: () => void
  onRetry: () => void
}

export function HrResultsSummary({
  summary,
  pendingAction,
  onRelease,
  onRetry,
}: Props) {
  const stats = [
    ["Pending release", summary.pendingRelease],
    ["Accepted", summary.accepted],
    ["Rejected", summary.rejected],
    ["Redirected", summary.redirected],
    ["Incomplete", summary.incomplete],
    ["Already released", summary.alreadyReleased],
  ] as const

  return (
    <>
      <div className={summaryGridClasses}>
        {stats.map(([label, value]) => (
          <div key={label} className={summaryCardClasses}>
            <p className={subheaderLabelClasses}>
              {formatSubheaderLabel(label)}
            </p>
            <p className={valueClasses}>{value}</p>
          </div>
        ))}
      </div>

      <div className={actionPanelClasses}>
        <p className={actionCopyClasses}>
          {summary.incomplete > 0
            ? `Cannot release results. ${summary.incomplete === 1 ? "There is" : "There are"} still ${summary.incomplete} pending application${summary.incomplete === 1 ? "" : "s"}.`
            : summary.pendingRelease > 0
              ? "All pending records are ready. Releasing publishes every result and queues applicable result emails. Membership payment and Member IDs are handled afterward."
              : "There are no pending results to release."}
        </p>
        <div className={actionButtonsClasses}>
          <Button
            type="button"
            color="purple"
            disabled={pendingAction !== null || summary.alreadyReleased === 0}
            onClick={onRetry}
          >
            {pendingAction === "retry" ? "Retrying…" : "Retry Failed Emails"}
          </Button>
          <Button
            type="button"
            disabled={pendingAction !== null || !summary.canRelease}
            onClick={onRelease}
          >
            Release Results
          </Button>
        </div>
      </div>
    </>
  )
}
