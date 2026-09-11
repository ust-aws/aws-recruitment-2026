"use client"

import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/field"
import { CommitteeOfficePicker } from "@/components/apply/committee-office-picker"
import { groupedCommitteesForPicker } from "@/lib/committee-groups"
import { fieldControlClasses } from "@/lib/surface"
import { ApplyInterviewSlotPicker } from "@/components/apply/apply-interview-slot-picker"
import { CommitteePickerSkeleton } from "@/components/apply/committee-picker-skeleton"
import { Input } from "@/components/ui/input"
import { useOpenPositions } from "@/lib/api"
import {
  GOOGLE_DRIVE_URL_EXAMPLE,
  GITHUB_PROFILE_URL_EXAMPLE,
} from "@/lib/apply-field-validation"
import {
  needsCreativesPortfolio,
  needsDevelopmentGithub,
} from "@/lib/committee-apply"

const stackClasses = "flex min-w-0 w-full flex-col gap-5"
const urlHintClasses = "font-sans text-xs text-prelude"
const textareaClasses = `${fieldControlClasses} h-auto min-h-28 py-3`

export type CommitteeValues = {
  firstCommittee: string
  firstPositionId: string
  secondCommittee: string
  secondPositionId: string
  motivation: string
  slotId: string
  portfolioUrl: string
  githubUrl: string
}

type CommitteeStepProps = {
  values: CommitteeValues
  onChange: (patch: Partial<CommitteeValues>) => void
}

export function CommitteeStep({ values, onChange }: CommitteeStepProps) {
  const { positions, committees, loading, error } = useOpenPositions()
  const committeeGroups = groupedCommitteesForPicker(committees)
  const showPortfolio = needsCreativesPortfolio(
    values.firstCommittee,
    values.secondCommittee
  )
  const showGithub = needsDevelopmentGithub(
    values.firstCommittee,
    values.secondCommittee
  )

  function applyChoice(
    rank: 1 | 2,
    next: { committee: string; positionId: string }
  ) {
    const firstCommittee =
      rank === 1 ? next.committee : values.firstCommittee
    const secondCommittee =
      rank === 2 ? next.committee : values.secondCommittee
    const patch: Partial<CommitteeValues> =
      rank === 1
        ? {
            firstCommittee: next.committee,
            firstPositionId: next.positionId,
            slotId:
              next.positionId === values.firstPositionId ? values.slotId : "",
          }
        : {
            secondCommittee: next.committee,
            secondPositionId: next.positionId,
          }
    if (!needsCreativesPortfolio(firstCommittee, secondCommittee)) {
      patch.portfolioUrl = ""
    }
    if (!needsDevelopmentGithub(firstCommittee, secondCommittee)) {
      patch.githubUrl = ""
    }
    onChange(patch)
  }

  return (
    <div className={stackClasses}>
      {error ? <p className="text-sm text-aquamarine">{error}</p> : null}
      {loading ? (
        <CommitteePickerSkeleton />
      ) : (
        <>
          <Field label="First choice" htmlFor="firstChoice" required>
            <CommitteeOfficePicker
              id="firstChoice"
              committee={values.firstCommittee}
              positionId={values.firstPositionId}
              groups={committeeGroups}
              positions={positions}
              disabled={loading}
              disabledPositionId={values.secondPositionId}
              onSelect={(next) => applyChoice(1, next)}
            />
          </Field>
          {values.firstPositionId ? (
            <ApplyInterviewSlotPicker
              positionId={values.firstPositionId}
              selectedSlotId={values.slotId}
              onSelectedSlotIdChange={(slotId) => onChange({ slotId })}
            />
          ) : null}
          <Field label="Second choice" htmlFor="secondChoice" required>
            <CommitteeOfficePicker
              id="secondChoice"
              committee={values.secondCommittee}
              positionId={values.secondPositionId}
              groups={committeeGroups}
              positions={positions}
              disabled={loading}
              disabledPositionId={values.firstPositionId}
              onSelect={(next) => applyChoice(2, next)}
            />
          </Field>
        </>
      )}
      {showPortfolio ? (
        <Field
          label="Google Drive Portfolio Link"
          htmlFor="portfolioUrl"
          required
        >
          <p className={urlHintClasses}>
            Paste a share link from Drive or Docs, e.g.{" "}
            <span className="text-blue-chalk/90">{GOOGLE_DRIVE_URL_EXAMPLE}</span>
          </p>
          <Input
            id="portfolioUrl"
            name="portfolioUrl"
            required
            type="url"
            inputMode="url"
            placeholder={GOOGLE_DRIVE_URL_EXAMPLE}
            value={values.portfolioUrl}
            onChange={(e) => onChange({ portfolioUrl: e.target.value })}
            className={fieldControlClasses}
          />
        </Field>
      ) : null}
      {showGithub ? (
        <Field label="GitHub Profile Link (optional)" htmlFor="githubUrl">
          <p className={urlHintClasses}>
            Profile URL only (not a repo), e.g.{" "}
            <span className="text-blue-chalk/90">{GITHUB_PROFILE_URL_EXAMPLE}</span>
          </p>
          <Input
            id="githubUrl"
            name="githubUrl"
            type="url"
            inputMode="url"
            placeholder={GITHUB_PROFILE_URL_EXAMPLE}
            value={values.githubUrl}
            onChange={(e) => onChange({ githubUrl: e.target.value })}
            className={fieldControlClasses}
          />
        </Field>
      ) : null}
      <Field label="Why do you want to join AWS Builders - UST?" htmlFor="motivation" required>
        <Textarea
          id="motivation"
          name="motivation"
          required
          value={values.motivation}
          onChange={(e) => onChange({ motivation: e.target.value })}
          placeholder="Tell us a bit of yourself..."
          className={textareaClasses}
        />
      </Field>
    </div>
  )
}
