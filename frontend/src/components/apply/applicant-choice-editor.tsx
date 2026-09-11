"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Field } from "@/components/field"
import { Input } from "@/components/ui/input"
import { CommitteeOfficePicker } from "@/components/apply/committee-office-picker"
import { CommitteePickerSkeleton } from "@/components/apply/committee-picker-skeleton"
import { groupedCommitteesForPicker } from "@/lib/committee-groups"
import {
  GITHUB_PROFILE_URL_EXAMPLE,
  GOOGLE_DRIVE_URL_EXAMPLE,
  isValidGithubUrl,
  isValidGoogleDriveUrl,
} from "@/lib/apply-field-validation"
import {
  needsCreativesPortfolio,
  needsDevelopmentGithub,
} from "@/lib/committee-apply"
import { useOpenPositions } from "@/lib/api"
import type { ApplicantApplication } from "@/lib/applicant-api"
import { fieldControlClasses } from "@/lib/surface"

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
  const first = application.choices.find((choice) => choice.preferenceRank === 1)
  const second = application.choices.find((choice) => choice.preferenceRank === 2)
  const { positions, committees, loading } = useOpenPositions()
  const groups = groupedCommitteesForPicker(committees)

  const [firstCommittee, setFirstCommittee] = useState(first?.committee ?? "")
  const [firstPositionId, setFirstPositionId] = useState(first?.positionId ?? "")
  const [secondCommittee, setSecondCommittee] = useState(second?.committee ?? "")
  const [secondPositionId, setSecondPositionId] = useState(second?.positionId ?? "")
  const [portfolioUrl, setPortfolioUrl] = useState(
    application.portfolioUrl ?? ""
  )
  const [githubUrl, setGithubUrl] = useState(application.githubUrl ?? "")
  const showPortfolio = needsCreativesPortfolio(firstCommittee, secondCommittee)
  const showGithub = needsDevelopmentGithub(firstCommittee, secondCommittee)
  const committeeChanged =
    Boolean(first?.committee) && firstCommittee !== first?.committee
  const needsSlot = committeeChanged && Boolean(firstPositionId)


  const canSubmit = useMemo(() => {
    if (!firstPositionId || !secondPositionId) return false
    if (firstPositionId === secondPositionId) return false
    if (needsSlot && !slotId) return false
    if (showPortfolio && !isValidGoogleDriveUrl(portfolioUrl)) return false
    if (
      showGithub &&
      githubUrl.trim() &&
      !isValidGithubUrl(githubUrl)
    ) {
      return false
    }
    return true
  }, [
    firstPositionId,
    githubUrl,
    needsSlot,
    portfolioUrl,
    secondPositionId,
    showGithub,
    showPortfolio,
    slotId,
  ])

  function applyChoice(
    rank: 1 | 2,
    next: { committee: string; positionId: string }
  ) {
    if (rank === 1) {
      setFirstCommittee(next.committee)
      setFirstPositionId(next.positionId)
      const nextNeedsSlot =
        Boolean(first?.committee) &&
        next.committee !== first?.committee &&
        Boolean(next.positionId)
      onPreviewPositionIdChange(
        nextNeedsSlot ? next.positionId : undefined
      )
    } else {
      setSecondCommittee(next.committee)
      setSecondPositionId(next.positionId)
    }
    const nextFirst = rank === 1 ? next.committee : firstCommittee
    const nextSecond = rank === 2 ? next.committee : secondCommittee
    if (!needsCreativesPortfolio(nextFirst, nextSecond)) {
      setPortfolioUrl("")
    }
    if (!needsDevelopmentGithub(nextFirst, nextSecond)) {
      setGithubUrl("")
    }
  }

  return (
    <form
      className={stackClasses}
      onSubmit={(event) => {
        event.preventDefault()
        onSave({
          choices: [
            { positionId: firstPositionId, preferenceRank: 1 },
            { positionId: secondPositionId, preferenceRank: 2 },
          ],
          ...(needsSlot && slotId ? { slotId } : {}),
          portfolioUrl,
          githubUrl,
        })
      }}
    >
      {loading ? (
        <CommitteePickerSkeleton />
      ) : (
        <>
          <Field label="First choice" htmlFor="dash-first-choice">
            <CommitteeOfficePicker
              id="dash-first-choice"
              committee={firstCommittee}
              positionId={firstPositionId}
              groups={groups}
              positions={positions}
              disabled={loading}
              disabledPositionId={secondPositionId}
              onSelect={(next) => applyChoice(1, next)}
            />
          </Field>
          <Field label="Second choice" htmlFor="dash-second-choice">
            <CommitteeOfficePicker
              id="dash-second-choice"
              committee={secondCommittee}
              positionId={secondPositionId}
              groups={groups}
              positions={positions}
              disabled={loading}
              disabledPositionId={firstPositionId}
              onSelect={(next) => applyChoice(2, next)}
            />
          </Field>
        </>
      )}
      {showPortfolio ? (
        <Field label="Google Drive portfolio" htmlFor="dash-portfolio">
          <Input
            id="dash-portfolio"
            type="url"
            placeholder={GOOGLE_DRIVE_URL_EXAMPLE}
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
            className={fieldControlClasses}
          />
        </Field>
      ) : null}
      {showGithub ? (
        <Field label="GitHub profile" htmlFor="dash-github">
          <Input
            id="dash-github"
            type="url"
            placeholder={GITHUB_PROFILE_URL_EXAMPLE}
            value={githubUrl}
            onChange={(e) => setGithubUrl(e.target.value)}
            className={fieldControlClasses}
          />
        </Field>
      ) : null}
      {needsSlot ? (
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
      <Button type="submit" color="cyan" disabled={pending || !canSubmit}>
        {pending ? "Saving…" : "Save committee choices"}
      </Button>
    </form>
  )
}
