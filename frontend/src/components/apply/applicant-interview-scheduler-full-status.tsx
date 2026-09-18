import type { ApplicantInterviewSchedule } from "@/lib/api/applicant"
import { Button } from "@/components/ui/button"
import {
  formatInterviewSlotLabel,
  formatSeasonBoundsRange,
} from "@/lib/datetime/display"
import type { InterviewSeasonBounds } from "@/lib/season/interview"

const hintClasses = "mt-1 font-sans text-sm text-prelude"
const committeeClasses = "mt-2 font-mono text-xs text-aquamarine"
const bookingClasses =
  "mt-4 rounded-[14px] border border-aquamarine/40 bg-aquamarine/10 px-4 py-3 font-sans text-sm text-blue-chalk"
const bookingActionsClasses = "mt-3 flex flex-wrap items-center gap-3"
const lockClasses =
  "mt-4 rounded-[14px] border border-rose-blush/45 bg-rose-deep/20 px-4 py-3 font-sans text-sm text-rose-glow"

type ApplicantInterviewSchedulerIntroProps = {
  previewMode: boolean
}

export function ApplicantInterviewSchedulerIntro({
  previewMode,
}: ApplicantInterviewSchedulerIntroProps) {
  return (
    <>
      <h2 className="font-sans text-lg font-semibold text-blue-chalk">
        Schedule your interview
      </h2>
      <p className={hintClasses}>
        {previewMode
          ? "This grid shows open slots for the first-choice committee you selected below. Pick one, then save committee choices."
          : "Pick one open slot for your first-choice committee. You can change your interview time until recruitment week ends."}
      </p>
    </>
  )
}

type ApplicantInterviewSchedulerFullStatusProps = {
  previewMode: boolean
  schedule: ApplicantInterviewSchedule | null
  seasonConfigured: boolean
  seasonLoading: boolean
  seasonBounds: InterviewSeasonBounds | null
}

export function ApplicantInterviewSchedulerFullStatus({
  previewMode,
  schedule,
  seasonConfigured,
  seasonLoading,
  seasonBounds,
}: ApplicantInterviewSchedulerFullStatusProps) {
  return (
    <>
      {schedule && seasonConfigured && seasonBounds ? (
        <p className={committeeClasses}>
          {schedule.committee.name} · season{" "}
          {formatSeasonBoundsRange(seasonBounds.startsAt, seasonBounds.endsAt)}
        </p>
      ) : null}

      {schedule && !schedule.canSchedule && schedule.lockReason ? (
        <p className={lockClasses} role="alert">{schedule.lockReason}</p>
      ) : null}

      {!previewMode && schedule?.booking ? (
        <div className={bookingClasses}>
          <p>Your interview: {formatInterviewSlotLabel(schedule.booking)}</p>
          <div className={bookingActionsClasses}>
            <Button
              color="purple"
              size="sm"
              nativeButton={false}
              render={
                <a
                  href="/api/applicant/interview-calendar"
                  download="aws-builders-ust-interview.ics"
                  aria-label="Download interview calendar invite"
                />
              }
            >
              Download calendar invite
            </Button>
          </div>
        </div>
      ) : null}

      {!seasonConfigured && !seasonLoading ? (
        <p className={lockClasses} role="status">
          Interview season is not configured. Check back later.
        </p>
      ) : null}
    </>
  )
}
