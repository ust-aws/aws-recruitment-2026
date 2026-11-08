import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ghostPillButtonClasses } from "@/lib/site/surface"

const actionsClasses =
  "mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
const nextButtonClasses = "h-10 px-5 text-xs"

type ApplyFormActionsProps = {
  step: number
  hrMode: boolean
  submitting: boolean
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}

function CancelLink({ hrMode, submitting }: { hrMode: boolean; submitting: boolean }) {
  return (
    <Button
      color="purple"
      className={ghostPillButtonClasses}
      nativeButton={false}
      render={<Link href={hrMode ? "/admin/hr" : "/apply/positions"} />}
      disabled={submitting}
    >
      {hrMode ? "Cancel" : "← Back"}
    </Button>
  )
}

function BackActions({
  hrMode,
  submitting,
  onBack,
}: Pick<ApplyFormActionsProps, "hrMode" | "submitting" | "onBack">) {
  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        color="purple"
        className={ghostPillButtonClasses}
        onClick={onBack}
        disabled={submitting}
      >
        ← Back
      </Button>
      {hrMode ? <CancelLink hrMode submitting={submitting} /> : null}
    </div>
  )
}

export function ApplyFormActions({
  step,
  hrMode,
  submitting,
  onBack,
  onNext,
  onSubmit,
}: ApplyFormActionsProps) {
  return (
    <div className={actionsClasses}>
      {step === 1 ? (
        <CancelLink hrMode={hrMode} submitting={submitting} />
      ) : (
        <BackActions hrMode={hrMode} submitting={submitting} onBack={onBack} />
      )}
      {step === 5 ? (
        <Button
          type="button"
          color="cyan"
          className={nextButtonClasses}
          onClick={onSubmit}
          disabled={submitting}
        >
          {hrMode ? "Add Applicant" : "Submit Application"}
        </Button>
      ) : (
        <Button
          type="button"
          color="cyan"
          className={nextButtonClasses}
          onClick={onNext}
        >
          Next → Step {step + 1}
        </Button>
      )}
    </div>
  )
}
