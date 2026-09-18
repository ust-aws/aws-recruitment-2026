import { CommitteeOfficePicker } from "@/components/apply/committee-office-picker"
import { ApplyInterviewSlotPicker } from "@/components/apply/apply-interview-slot-picker"
import { CommitteePickerSkeleton } from "@/components/apply/committee-picker-skeleton"
import { Field } from "@/components/shared/field"
import { Input } from "@/components/ui/input"
import { fieldControlClasses } from "@/lib/site/surface"
import {
  GOOGLE_DRIVE_URL_EXAMPLE,
  GITHUB_PROFILE_URL_EXAMPLE,
} from "@/lib/apply/field-validation"
import type { CommitteeValues } from "@/components/apply/apply-schema"
import type { Position } from "@/lib/types/application"
import type { CommitteeOfficeGroup } from "@/lib/apply/committee-groups"

const urlHintClasses = "font-sans text-xs text-prelude"

type CommitteeStepPositionFieldsProps = {
  values: CommitteeValues
  errors?: Partial<Record<keyof CommitteeValues, string>>
  loading: boolean
  error: string | null
  committeeGroups: CommitteeOfficeGroup[]
  positions: Position[]
  showPortfolio: boolean
  showGithub: boolean
  onChange: (patch: Partial<CommitteeValues>) => void
  onChoiceSelect: (
    rank: 1 | 2,
    next: { committee: string; positionId: string },
  ) => void
}

export function CommitteeStepPositionFields({
  values,
  errors,
  loading,
  error,
  committeeGroups,
  positions,
  showPortfolio,
  showGithub,
  onChange,
  onChoiceSelect,
}: CommitteeStepPositionFieldsProps) {
  return (
    <>
      {error ? <p className="text-sm text-aquamarine">{error}</p> : null}
      {loading ? (
        <CommitteePickerSkeleton />
      ) : (
        <>
      <Field
        label="First choice"
        htmlFor="firstChoice"
        required
        error={errors?.firstPositionId}
      >
        <CommitteeOfficePicker
          id="firstChoice"
          committee={values.firstCommittee}
          positionId={values.firstPositionId}
          groups={committeeGroups}
          positions={positions}
          disabled={loading}
          disabledPositionId={values.secondPositionId}
          onSelect={(next) => onChoiceSelect(1, next)}
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
          {errors?.slotId ? (
            <p role="alert" className="text-xs text-rose-glow">
              {errors.slotId}
            </p>
          ) : null}
        </>
      ) : null}
      <Field
        label="Second choice"
        htmlFor="secondChoice"
        required
        error={errors?.secondPositionId}
      >
        <CommitteeOfficePicker
          id="secondChoice"
          committee={values.secondCommittee}
          positionId={values.secondPositionId}
          groups={committeeGroups}
          positions={positions}
          disabled={loading}
          disabledPositionId={values.firstPositionId}
          onSelect={(next) => onChoiceSelect(2, next)}
        />
      </Field>
      {showPortfolio ? (
        <Field
          label="Google Drive Portfolio Link"
          htmlFor="portfolioUrl"
          required
          error={errors?.portfolioUrl}
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
        <Field
          label="GitHub Profile Link (optional)"
          htmlFor="githubUrl"
          error={errors?.githubUrl}
        >
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
        </>
      )}
    </>
  )
}
