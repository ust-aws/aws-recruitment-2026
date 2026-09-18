"use client"

import { Button } from "@/components/ui/button"
import { Field } from "@/components/shared/field"
import { Input } from "@/components/ui/input"
import { CommitteeOfficePicker } from "@/components/apply/committee-office-picker"
import { CommitteePickerSkeleton } from "@/components/apply/committee-picker-skeleton"
import {
  GITHUB_PROFILE_URL_EXAMPLE,
  GOOGLE_DRIVE_URL_EXAMPLE,
} from "@/lib/apply/field-validation"
import type { ApplicantApplication } from "@/lib/api/applicant"
import { fieldControlClasses } from "@/lib/site/surface"
import { useApplicantChoiceEditorState } from "@/components/apply/applicant-choice-editor-state"

const stackClasses = "mt-6 flex flex-col gap-4"
const errorClasses = "text-sm text-rose-glow"
const successClasses = "text-sm text-aquamarine"
const hintClasses = "font-sans text-sm text-prelude"

type ApplicantChoiceEditorProps = {
  application: ApplicantApplication
  pending: boolean
  error: string
  success?: string
  slotId: string
  onPreviewPositionIdChange: (positionId: string | undefined) => void
  onSave: (input: {
    choices: { positionId: string; preferenceRank: 1 | 2 }[]
    slotId?: string
    portfolioUrl?: string
    githubUrl?: string
  }) => void
}

export function ApplicantChoiceEditor({
  application,
  pending,
  error,
  success = "",
  slotId,
  onPreviewPositionIdChange,
  onSave,
}: ApplicantChoiceEditorProps) {
  const editor = useApplicantChoiceEditorState(
    application,
    slotId,
    onPreviewPositionIdChange,
  )

  return (
    <form
      className={stackClasses}
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          choices: [
            { positionId: editor.firstPositionId, preferenceRank: 1 },
            { positionId: editor.secondPositionId, preferenceRank: 2 },
          ],
          ...(editor.needsSlot && slotId ? { slotId } : {}),
          portfolioUrl: editor.portfolioUrl,
          githubUrl: editor.githubUrl,
        })
      }}
    >
      {editor.loading ? (
        <CommitteePickerSkeleton />
      ) : (
        <>
          <Field label="First choice" htmlFor="dash-first-choice">
            <CommitteeOfficePicker
              id="dash-first-choice"
              committee={editor.firstCommittee}
              positionId={editor.firstPositionId}
              groups={editor.groups}
              positions={editor.positions}
              disabled={editor.loading}
              disabledPositionId={editor.secondPositionId}
              onSelect={(next) => editor.applyChoice(1, next)}
            />
          </Field>
          <Field label="Second choice" htmlFor="dash-second-choice">
            <CommitteeOfficePicker
              id="dash-second-choice"
              committee={editor.secondCommittee}
              positionId={editor.secondPositionId}
              groups={editor.groups}
              positions={editor.positions}
              disabled={editor.loading}
              disabledPositionId={editor.firstPositionId}
              onSelect={(next) => editor.applyChoice(2, next)}
            />
          </Field>
        </>
      )}
      {editor.showPortfolio ? (
        <Field label="Google Drive portfolio" htmlFor="dash-portfolio">
          <Input
            id="dash-portfolio"
            type="url"
            placeholder={GOOGLE_DRIVE_URL_EXAMPLE}
            value={editor.portfolioUrl}
            onChange={(e) => editor.setPortfolioUrl(e.target.value)}
            className={fieldControlClasses}
          />
        </Field>
      ) : null}
      {editor.showGithub ? (
        <Field label="GitHub profile" htmlFor="dash-github">
          <Input
            id="dash-github"
            type="url"
            placeholder={GITHUB_PROFILE_URL_EXAMPLE}
            value={editor.githubUrl}
            onChange={(e) => editor.setGithubUrl(e.target.value)}
            className={fieldControlClasses}
          />
        </Field>
      ) : null}
      {editor.needsSlot ? (
        <p className={hintClasses}>
          Pick an open interview slot in the schedule above, then save. Booked
          cells belong to other applicants.
        </p>
      ) : null}
      {error ? (
        <p className={errorClasses} role="alert">
          {error}
        </p>
      ) : success ? (
        <p className={successClasses} role="status">{success}</p>
      ) : null}
      <Button type="submit" color="cyan" disabled={pending || !editor.canSubmit}>
        {pending ? "Saving…" : "Save committee choices"}
      </Button>
    </form>
  )
}
