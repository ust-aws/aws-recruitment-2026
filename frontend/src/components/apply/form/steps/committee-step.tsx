"use client"

import { useMemo } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Field } from "@/components/shared/field"
import { groupedCommitteesForPicker } from "@/lib/apply/committee-groups"
import { fieldControlClasses } from "@/lib/site/surface"
import { useOpenPositions } from "@/lib/api"
import {
  needsCreativesPortfolio,
  needsDevelopmentGithub,
} from "@/lib/apply/committee"
import type { CommitteeValues } from "@/components/apply/form/apply-schema"
import { CommitteeStepApplicationType } from "@/components/apply/form/steps/committee-step-application-type"
import {
  buildCommitteeChoicePatch,
  memberChoicePatch,
} from "@/components/apply/form/steps/committee-step-choice-patch"
import { CommitteeStepPositionFields } from "@/components/apply/form/steps/committee-step-position-fields"
import type { CommitteeOfficeGroup } from "@/lib/apply/committee-groups"
import { useRecruitmentTrack } from "@/lib/recruitment-track"

const stackClasses = "flex min-w-0 w-full flex-col gap-5"
const memberNoticeClasses =
  "rounded-[14px] border border-biloba-flower/35 bg-daisy-bush/20 px-4 py-3 font-sans text-sm leading-relaxed text-blue-chalk"
const textareaClasses = `${fieldControlClasses} h-auto min-h-28 py-3`

type CommitteeStepProps = {
  hrMode?: boolean
  values: CommitteeValues
  onChange: (patch: Partial<CommitteeValues>) => void
  errors?: Partial<Record<keyof CommitteeValues, string>>
}

export function CommitteeStep({ values, onChange, errors, hrMode = false }: CommitteeStepProps) {
  const hunt = useRecruitmentTrack() === "officer_hunt"
  const { positions: openPositions, loading, error } = useOpenPositions(hrMode)
  const positions = openPositions
  const committees = useMemo(
    () => [...new Set(positions.map((position) => position.committee))],
    [positions],
  )
  const committeeGroups = useMemo(() => {
    const groups = groupedCommitteesForPicker(committees)
    if (!hrMode) return groups
    const included = new Set(groups.flatMap((group) => group.committees))
    const additional = new Map<string, string[]>()
    for (const position of positions) {
      if (included.has(position.committee)) continue
      const office = position.office || "Other Committees"
      const names = additional.get(office) ?? []
      if (!names.includes(position.committee)) names.push(position.committee)
      additional.set(office, names)
    }
    return [
      ...groups,
      ...[...additional].map(([office, names]): CommitteeOfficeGroup => ({
        office,
        committees: names,
      })),
    ]
  }, [committees, hrMode, positions])
  const positionApplication = values.applicationType === "position"
  const positionTitle = (positionId: string) =>
    positions.find((position) => position.id === positionId)?.title ?? ""
  // The portfolio and GitHub rules are R101's committees; the hunt asks for neither.
  const showPortfolio =
    positionApplication &&
    !hunt &&
    needsCreativesPortfolio(values.firstCommittee, values.secondCommittee)
  const showGithub =
    positionApplication &&
    !hunt &&
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
      {hunt ? null : (
        <CommitteeStepApplicationType
          hrMode={hrMode}
          positionApplication={positionApplication}
          onSelect={setApplicationType}
        />
      )}

      {positionApplication ? (
        <CommitteeStepPositionFields
          hrMode={hrMode}
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
          {hrMode
            ? "Member-only applicants are accepted automatically and do not need committee choices or an interview."
            : "Member-only applicants are accepted automatically, do not need an interview, and will receive payment instructions after R101. No committee choices or interview are required."}
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
