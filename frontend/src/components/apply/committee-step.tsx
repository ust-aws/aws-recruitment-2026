"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
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
import type { CommitteeValues } from "@/components/apply/apply-schema"

const stackClasses = "flex min-w-0 w-full flex-col gap-5"
const typeOptionsClasses = "grid gap-3 sm:grid-cols-2"
const typeButtonClasses = "h-auto min-h-20 justify-start px-4 py-3 text-left"
const typeTitleClasses = "block font-sans text-sm font-semibold"
const typeDescriptionClasses = "mt-1 block font-sans text-xs leading-relaxed opacity-85"
const memberNoticeClasses =
  "rounded-[14px] border border-biloba-flower/35 bg-daisy-bush/20 px-4 py-3 font-sans text-sm leading-relaxed text-blue-chalk"
const urlHintClasses = "font-sans text-xs text-prelude"
const textareaClasses = `${fieldControlClasses} h-auto min-h-28 py-3`

const memberChoicePatch: Partial<CommitteeValues> = {
  firstCommittee: "",
  firstPositionId: "",
  firstPositionTitle: "",
  secondCommittee: "",
  secondPositionId: "",
  secondPositionTitle: "",
  slotId: "",
  portfolioUrl: "",
  githubUrl: "",
}

type CommitteeStepProps = {
  values: CommitteeValues
  onChange: (patch: Partial<CommitteeValues>) => void
  errors?: Partial<Record<keyof CommitteeValues, string>>
}

export function CommitteeStep({ values, onChange, errors }: CommitteeStepProps) {
  const { positions, committees, loading, error } = useOpenPositions()
  const committeeGroups = groupedCommitteesForPicker(committees)
  const positionApplication = values.applicationType === "position"
  const showPortfolio =
    positionApplication &&
    needsCreativesPortfolio(values.firstCommittee, values.secondCommittee)
  const positionTitle = (positionId: string) =>
    positions.find((position) => position.id === positionId)?.title ?? ""
  const showGithub =
    positionApplication &&
    needsDevelopmentGithub(
      values.firstCommittee,
      values.secondCommittee,
      values.firstPositionTitle,
      values.secondPositionTitle,
    )

  function setApplicationType(applicationType: CommitteeValues["applicationType"]) {
    onChange(
      applicationType === "member"
        ? { applicationType, ...memberChoicePatch }
        : { applicationType },
    )
  }

  function applyChoice(
    rank: 1 | 2,
    next: { committee: string; positionId: string },
  ) {
    const nextTitle = positionTitle(next.positionId)
    const firstCommittee = rank === 1 ? next.committee : values.firstCommittee
    const secondCommittee = rank === 2 ? next.committee : values.secondCommittee
    const firstTitle = rank === 1 ? nextTitle : values.firstPositionTitle
    const secondTitle = rank === 2 ? nextTitle : values.secondPositionTitle
    const patch: Partial<CommitteeValues> =
      rank === 1
        ? {
            firstCommittee: next.committee,
            firstPositionId: next.positionId,
            firstPositionTitle: nextTitle,
            slotId:
              next.committee === values.firstCommittee &&
              next.positionId === values.firstPositionId
                ? values.slotId
                : "",
          }
        : {
            secondCommittee: next.committee,
            secondPositionId: next.positionId,
            secondPositionTitle: nextTitle,
          }
    if (!needsCreativesPortfolio(firstCommittee, secondCommittee)) {
      patch.portfolioUrl = ""
    }
    if (
      !needsDevelopmentGithub(
        firstCommittee,
        secondCommittee,
        firstTitle,
        secondTitle,
      )
    ) {
      patch.githubUrl = ""
    }
    onChange(patch)
  }

  return (
    <div className={stackClasses}>
      <Field label="How would you like to apply?" required>
        <div className={typeOptionsClasses} role="radiogroup">
          <Button
            type="button"
            color={positionApplication ? "cyan" : "purple"}
            variant={positionApplication ? "default" : "outline"}
            className={typeButtonClasses}
            role="radio"
            aria-checked={positionApplication}
            onClick={() => setApplicationType("position")}
          >
            <span>
              <span className={typeTitleClasses}>Committee position</span>
              <span className={typeDescriptionClasses}>
                Choose two positions and an interview schedule.
              </span>
            </span>
          </Button>
          <Button
            type="button"
            color={!positionApplication ? "cyan" : "purple"}
            variant={!positionApplication ? "default" : "outline"}
            className={typeButtonClasses}
            role="radio"
            aria-checked={!positionApplication}
            onClick={() => setApplicationType("member")}
          >
            <span>
              <span className={typeTitleClasses}>Member-only</span>
              <span className={typeDescriptionClasses}>
                Join without applying for a committee position or interview.
              </span>
            </span>
          </Button>
        </div>
      </Field>

      {positionApplication ? (
        <>
          {error ? <p className="text-sm text-aquamarine">{error}</p> : null}
          {loading ? (
            <CommitteePickerSkeleton />
          ) : (
            <>
              <Field label="First choice" htmlFor="firstChoice" required error={errors?.firstPositionId}>
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
                <>
                  <ApplyInterviewSlotPicker
                    key={values.firstPositionId}
                    positionId={values.firstPositionId}
                    selectedSlotId={values.slotId}
                    onSelectedSlotIdChange={(slotId) => onChange({ slotId })}
                  />
                  {errors?.slotId ? <p role="alert" className="text-xs text-rose-glow">{errors.slotId}</p> : null}
                </>
              ) : null}
              <Field label="Second choice" htmlFor="secondChoice" required error={errors?.secondPositionId}>
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
              error={errors?.portfolioUrl}
            >
              <p className={urlHintClasses}>
                Paste a share link from Drive or Docs, e.g. {" "}
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
            <Field label="GitHub Profile Link (optional)" htmlFor="githubUrl" error={errors?.githubUrl}>
              <p className={urlHintClasses}>
                Profile URL only (not a repo), e.g. {" "}
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
        </>
      ) : (
        <p className={memberNoticeClasses}>
          Member-only applicants are accepted automatically, do not need an interview, and will receive payment instructions after R101. No committee choices or interview are required.
        </p>
      )}

      <Field label="Why do you want to join AWS Builders - UST?" htmlFor="motivation" required error={errors?.motivation}>
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