import type { ApplicantInterviewSchedule } from "@/lib/api/applicant"
import {
  applicantSectionAreaClasses,
  applicantSectionStatusClasses,
  applicantSectionTitleClasses,
} from "@/components/apply/dashboard/applicant-section-classes"
import { Button } from "@/components/ui/button"
import {
  formatInterviewSlotLabel,
  formatSeasonBoundsRange,
} from "@/lib/datetime/display"
import { dashboardActionTargetClasses } from "@/lib/site/dashboard-surface"
import type { InterviewSeasonBounds } from "@/lib/season/interview"

// Same frame as every dashboard section. The status line says where the
// applicant stands: their booked slot, or that they still need one.
const hintClasses = "mt-4 font-sans text-sm leading-relaxed text-pretty text-prelude"
const committeeClasses = "mt-1 font-mono text-xs text-prelude"
const bookingActionsClasses = "mt-3 flex flex-wrap items-center gap-3"
const lockClasses =
  "mt-4 rounded-lg border border-rose-blush/45 bg-rose-deep/20 px-4 py-3 font-sans text-sm text-rose-glow"

type ApplicantInterviewSchedulerIntroProps = {
  previewMode: boolean
  schedule: ApplicantInterviewSchedule | null
}

export function ApplicantInterviewSchedulerIntro({
  previewMode,
  schedule,
}: ApplicantInterviewSchedulerIntroProps) {
  const booking = previewMode ? null : schedule?.booking
  return (
    <>
      <p className={applicantSectionAreaClasses}>{"// INTERVIEW"}</p>
      <h3 id="applicant-interview-title" className={applicantSectionTitleClasses}>
        {booking ? "Your interview" : "Schedule your interview"}
      </h3>
      <p className={applicantSectionStatusClasses}>
        {booking
          ? `Booked: ${formatInterviewSlotLabel(booking)}`
          : previewMode
            ? "This grid shows open slots for the first-choice committee you selected below. Pick one, then save committee choices."
            : "Pick one open slot for your first-choice committee."}
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
  const booked = !previewMode && Boolean(schedule?.booking)
  return (
    <>
      {schedule && seasonConfigured && seasonBounds ? (
        <p className={committeeClasses}>
          {schedule.committee.name} · season{" "}
          {formatSeasonBoundsRange(seasonBounds.startsAt, seasonBounds.endsAt)}
        </p>
      ) : null}

      {booked ? (
        <div className={bookingActionsClasses}>
          <Button
            color="purple"
            size="sm"
            className={dashboardActionTargetClasses}
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
      ) : null}

      {!previewMode ? (
        <p className={hintClasses}>You can change your interview time until recruitment week ends.</p>
      ) : null}

      {schedule && !schedule.canSchedule && schedule.lockReason ? (
        <p className={lockClasses} role="alert">{schedule.lockReason}</p>
      ) : null}

      {!seasonConfigured && !seasonLoading ? (
        <p className={lockClasses} role="status">
          Interview season is not configured. Check back later.
        </p>
      ) : null}
    </>
  )
}
