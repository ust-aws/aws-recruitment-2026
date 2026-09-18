import { ActionFeedback } from "@/components/shared/action-feedback"
import { SlotGrid, type SlotGridCell } from "@/components/interview/slot-grid"
import { InterviewWeekNav } from "@/components/interview/week-nav"
import { Button } from "@/components/ui/button"
import type { ApplicantInterviewSchedule } from "@/lib/api/applicant"
import {
  ApplicantInterviewSchedulerFullStatus,
  ApplicantInterviewSchedulerIntro,
} from "@/components/apply/applicant-interview-scheduler-full-status"
import type { InterviewSeasonBounds } from "@/lib/season/interview"

const sectionClasses = "mt-8 border-t border-biloba-flower/20 pt-8"
const lockClasses =
  "mt-4 rounded-[14px] border border-rose-blush/45 bg-rose-deep/20 px-4 py-3 font-sans text-sm text-rose-glow"
const actionsClasses = "mt-4 flex flex-wrap gap-3"

type WeekNavProps = {
  weekLabel: string
  disabled: boolean
  canGoPrev: boolean
  canGoNext: boolean
  onPrev: () => void
  onNext: () => void
}

export function ApplicantInterviewWeekNav({
  weekLabel,
  disabled,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
}: WeekNavProps) {
  return (
    <InterviewWeekNav
      className="mt-4"
      weekLabel={weekLabel}
      prevDisabled={disabled || !canGoPrev}
      nextDisabled={disabled || !canGoNext}
      onPrev={onPrev}
      onNext={onNext}
    />
  )
}

type SchedulerGridBlockProps = {
  seasonConfigured: boolean
  days: Date[]
  cells: Map<string, SlotGridCell>
  loading: boolean
  gridLocked: boolean
  emptyMessage: string
  onCellClick: (cell: SlotGridCell) => void
}

function ApplicantInterviewSchedulerGridBlock({
  seasonConfigured,
  days,
  cells,
  loading,
  gridLocked,
  emptyMessage,
  onCellClick,
}: SchedulerGridBlockProps) {
  return (
    <div className="mt-4">
      {seasonConfigured ? (
        <SlotGrid
          days={days}
          cells={cells}
          loading={loading}
          scrollable
          onCellClick={gridLocked ? undefined : onCellClick}
          emptyMessage={emptyMessage}
        />
      ) : null}
    </div>
  )
}

type SchedulerShellProps = {
  schedule: ApplicantInterviewSchedule | null
  seasonConfigured: boolean
  seasonLoading: boolean
  seasonBounds: InterviewSeasonBounds
  days: Date[]
  cells: Map<string, SlotGridCell>
  loading: boolean
  weekNav: WeekNavProps
  gridLocked: boolean
  onCellClick: (cell: SlotGridCell) => void
  gridEmptyMessage: string
  error: string
}

type ApplicantInterviewSchedulerConfirmProps = {
  pending: boolean
  enabled: boolean
  onConfirm: () => void
}

function ApplicantInterviewSchedulerConfirm({
  pending,
  enabled,
  onConfirm,
}: ApplicantInterviewSchedulerConfirmProps) {
  return (
    <div className={actionsClasses}>
      <Button
        type="button"
        color="cyan"
        disabled={pending || !enabled}
        onClick={onConfirm}
      >
        {pending ? "Confirming…" : "Confirm Interview Slot"}
      </Button>
    </div>
  )
}

type ApplicantInterviewSchedulerFullProps = SchedulerShellProps & {
  previewMode: boolean
  success: string
  confirm?: ApplicantInterviewSchedulerConfirmProps
}

export function ApplicantInterviewSchedulerFull({
  previewMode,
  schedule,
  seasonConfigured,
  seasonLoading,
  seasonBounds,
  days,
  cells,
  loading,
  weekNav,
  gridLocked,
  onCellClick,
  gridEmptyMessage,
  error,
  success,
  confirm,
}: ApplicantInterviewSchedulerFullProps) {
  return (
    <section className={sectionClasses}>
      <ApplicantInterviewSchedulerIntro previewMode={previewMode} />
      <ApplicantInterviewSchedulerFullStatus
        previewMode={previewMode}
        schedule={schedule}
        seasonConfigured={seasonConfigured}
        seasonLoading={seasonLoading}
        seasonBounds={seasonBounds}
      />

      <ApplicantInterviewWeekNav {...weekNav} />

      <ApplicantInterviewSchedulerGridBlock
        seasonConfigured={seasonConfigured}
        days={days}
        cells={cells}
        loading={loading}
        gridLocked={gridLocked}
        emptyMessage={gridEmptyMessage}
        onCellClick={onCellClick}
      />

      {confirm ? <ApplicantInterviewSchedulerConfirm {...confirm} /> : null}

      {error ? <ActionFeedback type="error" message={error} /> : null}
      {success ? <ActionFeedback type="success" message={success} /> : null}
    </section>
  )
}

export function ApplicantInterviewSchedulerCompact({
  schedule,
  seasonConfigured,
  seasonLoading,
  days,
  cells,
  loading,
  weekNav,
  gridLocked,
  onCellClick,
  gridEmptyMessage,
  error,
}: Omit<SchedulerShellProps, "seasonBounds">) {
  return (
    <div className="mt-4">
      {schedule && !schedule.canSchedule && schedule.lockReason ? (
        <p className={lockClasses} role="alert">{schedule.lockReason}</p>
      ) : null}

      {!seasonConfigured && !seasonLoading ? (
        <p className={lockClasses} role="status">
          Interview season is not configured.
        </p>
      ) : null}

      <ApplicantInterviewWeekNav {...weekNav} />

      <ApplicantInterviewSchedulerGridBlock
        seasonConfigured={seasonConfigured}
        days={days}
        cells={cells}
        loading={loading}
        gridLocked={gridLocked}
        emptyMessage={gridEmptyMessage}
        onCellClick={onCellClick}
      />

      {error ? <ActionFeedback type="error" message={error} /> : null}
    </div>
  )
}
