"use client"

import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/shared/field"
import { groupedCommitteesForPicker } from "@/lib/apply/committee-groups"
import { fieldControlClasses } from "@/lib/site/surface"
import { useOpenPositions } from "@/lib/api"
import {
  needsCreativesPortfolio,
  needsDevelopmentGithub,
} from "@/lib/apply/committee"
import type { CommitteeValues } from "@/components/apply/apply-schema"
import { CommitteeStepApplicationType } from "@/components/apply/committee-step-application-type"
import {
  buildCommitteeChoicePatch,
  memberChoicePatch,
} from "@/components/apply/committee-step-choice-patch"
import { CommitteeStepPositionFields } from "@/components/apply/committee-step-position-fields"

const stackClasses = "flex min-w-0 w-full flex-col gap-5"
const memberNoticeClasses =
  "rounded-[14px] border border-biloba-flower/35 bg-daisy-bush/20 px-4 py-3 font-sans text-sm leading-relaxed text-blue-chalk"
const textareaClasses = `${fieldControlClasses} h-auto min-h-28 py-3`

type CommitteeStepProps = {
  values: CommitteeValues
  onChange: (patch: Partial<CommitteeValues>) => void
  errors?: Partial<Record<keyof CommitteeValues, string>>
}

export function CommitteeStep({ values, onChange, errors }: CommitteeStepProps) {
  const { positions, committees, loading, error } = useOpenPositions()
  const committeeGroups = groupedCommitteesForPicker(committees)
  const positionApplication = values.applicationType === "position"
  const positionTitle = (positionId: string) =>
    positions.find((position) => position.id === positionId)?.title ?? ""
  const showPortfolio =
    positionApplication &&
    needsCreativesPortfolio(values.firstCommittee, values.secondCommittee)
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
    onChange(buildCommitteeChoicePatch(rank, next, values, positionTitle))
  }

  return (
    <div className={stackClasses}>
      <CommitteeStepApplicationType
        positionApplication={positionApplication}
        onSelect={setApplicationType}
      />

      {positionApplication ? (
        <CommitteeStepPositionFields
          values={values}
          errors={errors}
          loading={loading}
          error={error}
          committeeGroups={committeeGroups}
          positions={positions}
          showPortfolio={showPortfolio}
          showGithub={showGithub}
          onChange={onChange}
          onChoiceSelect={applyChoice}
        />
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
