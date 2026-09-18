"use client"

import { ActionFeedback } from "@/components/shared/action-feedback"
import { SlotGrid } from "@/components/interview/slot-grid"
import { InterviewWeekNav } from "@/components/interview/week-nav"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CommitteeOfficeCommitteePicker } from "@/components/shared/committee-office-committee-picker"
import { Field } from "@/components/shared/field"
import { formatSeasonBoundsRange } from "@/lib/datetime/display"
import type { InterviewSeasonBounds } from "@/lib/season/interview"
import {
  addDays,
  canGoNextWeek,
  canGoPrevWeek,
  clampWeekStart,
} from "@/lib/season/interview"
import { glassPanelClasses } from "@/lib/site/surface"
import { cn } from "@/lib/utils"
import type { useHrInterviewGrid } from "@/components/hr/use-hr-interview-grid"

const panelClasses = `${glassPanelClasses} px-5 py-5`
const toolbarClasses = "mt-4 flex flex-wrap items-end justify-between gap-4"
const navButtonClasses = "h-9 px-4 text-xs"
const hintClasses = "mt-2 font-sans text-sm text-prelude"
const seasonClasses = "font-mono text-xs text-aquamarine"

type GridState = ReturnType<typeof useHrInterviewGrid>

type HrInterviewGridViewProps = GridState & {
  seasonLoading: boolean
  seasonConfigured: boolean
}

function HrInterviewSeasonLabel({
  seasonConfigured,
  seasonLoading,
  seasonBounds,
}: {
  seasonConfigured: boolean
  seasonLoading: boolean
  seasonBounds: InterviewSeasonBounds
}) {
  if (seasonConfigured && seasonBounds) {
    return (
      <>
        {formatSeasonBoundsRange(seasonBounds.startsAt, seasonBounds.endsAt)}
      </>
    )
  }
  if (seasonLoading) {
    return <Skeleton className="ml-1 inline-block h-4 w-36 align-middle" />
  }
  return <>Not configured — set dates above.</>
}

function HrInterviewGridBody({
  seasonConfigured,
  seasonLoading,
  committeeId,
  days,
  cells,
  loading,
  fetching,
  onCellClick,
  onCellPointerDown,
  onCellPointerEnter,
  draggedCellKeys,
}: Pick<
  HrInterviewGridViewProps,
  | "seasonConfigured"
  | "seasonLoading"
  | "committeeId"
  | "days"
  | "cells"
  | "loading"
  | "fetching"
  | "onCellClick"
  | "onCellPointerDown"
  | "onCellPointerEnter"
  | "draggedCellKeys"
>) {
  if (!seasonConfigured && !seasonLoading) {
    return (
      <p className={`${hintClasses} mt-6`} role="status">
        Interview season is not configured. Save interview dates above to manage
        slots.
      </p>
    )
  }
  if (!committeeId) {
    return (
      <p className={`${hintClasses} mt-6`}>
        Select a committee to manage its weekly grid.
      </p>
    )
  }
  return (
    <div
      className={cn("mt-6", fetching && "pointer-events-none opacity-75")}
      aria-busy={fetching}
    >
      <SlotGrid
        days={days}
        cells={cells}
        loading={loading}
        scrollable
        scrollShellClassName="max-h-[min(40rem,calc(100vh-14rem))] overflow-x-auto overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
        onCellClick={onCellClick}
        onCellPointerDown={onCellPointerDown}
        onCellPointerEnter={onCellPointerEnter}
        draggedCellKeys={draggedCellKeys}
        emptyMessage="No Monday–Saturday days fall in this interview week."
      />
    </div>
  )
}

export function HrInterviewGridView({
  seasonLoading,
  seasonConfigured,
  seasonBounds,
  groups,
  positionsLoading,
  committeeName,
  selectCommittee,
  committeeId,
  displayedWeekStart,
  days,
  cells,
  loading,
  fetching,
  pending,
  error,
  setError,
  success,
  weekLabel,
  setWeekStart,
  resetOpen,
  setResetOpen,
  onCellClick,
  onCellPointerDown,
  onCellPointerEnter,
  draggedCellKeys,
  resetSchedule,
}: HrInterviewGridViewProps) {
  return (
    <section className={panelClasses}>
      <h2 className="font-sans text-lg font-semibold text-blue-chalk">
        Interview Slots
      </h2>
      <p className={hintClasses}>
        Weeks run Sunday–Saturday; interviews are Monday–Saturday, 7:00 AM–9:30
        PM. Drag through cells to open or close several slots at once. Booked
        slots stay locked until you close them or reset the committee schedule.
      </p>
      <div className={`${hintClasses} ${seasonClasses}`}>
        Interview Season:{" "}
        <HrInterviewSeasonLabel
          seasonConfigured={seasonConfigured}
          seasonLoading={seasonLoading}
          seasonBounds={seasonBounds}
        />
      </div>

      {error ? <ActionFeedback type="error" message={error} /> : null}
      {!error && success ? (
        <ActionFeedback type="success" message={success} />
      ) : null}

      <div className={toolbarClasses}>
        <Field label="Committee" htmlFor="hr-interview-committee" className="min-w-[14rem] flex-1">
          <CommitteeOfficeCommitteePicker
            id="hr-interview-committee"
            committee={committeeName}
            groups={groups}
            disabled={positionsLoading}
            placeholder="Select an office and committee"
            onSelect={selectCommittee}
          />
        </Field>

        <InterviewWeekNav
          weekLabel={weekLabel}
          prevDisabled={
            !seasonConfigured ||
            !canGoPrevWeek(displayedWeekStart, seasonBounds)
          }
          nextDisabled={
            !seasonConfigured ||
            !canGoNextWeek(displayedWeekStart, seasonBounds)
          }
          onPrev={() => {
            setError("")
            setWeekStart(
              clampWeekStart(addDays(displayedWeekStart, -7), seasonBounds),
            )
          }}
          onNext={() => {
            setError("")
            setWeekStart(
              clampWeekStart(addDays(displayedWeekStart, 7), seasonBounds),
            )
          }}
        />

        <Button
          type="button"
          color="danger"
          className={navButtonClasses}
          disabled={!committeeId || pending}
          onClick={() => setResetOpen(true)}
        >
          Reset schedule
        </Button>
      </div>

      <HrInterviewGridBody
        seasonConfigured={seasonConfigured}
        seasonLoading={seasonLoading}
        committeeId={committeeId}
        days={days}
        cells={cells}
        loading={loading}
        fetching={fetching}
        onCellClick={onCellClick}
        onCellPointerDown={onCellPointerDown}
        onCellPointerEnter={onCellPointerEnter}
        draggedCellKeys={draggedCellKeys}
      />

      <Dialog
        open={resetOpen}
        onOpenChange={(open) => {
          if (!pending && !open) setResetOpen(false)
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Reset interview schedule?</DialogTitle>
            <DialogDescription>
              {committeeName
                ? `This removes every open, closed, and booked interview slot for ${committeeName}, including applicant bookings. You cannot undo this.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              color="purple"
              disabled={pending}
              onClick={() => setResetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              color="danger"
              disabled={pending || !committeeId}
              onClick={() => void resetSchedule()}
            >
              {pending ? "Resetting…" : "Reset schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
