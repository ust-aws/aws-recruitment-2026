import { useMemo, useState } from "react"
import {
  isValidGithubUrl,
  isValidGoogleDriveUrl,
} from "@/lib/apply/field-validation"
import {
  needsCreativesPortfolio,
  needsDevelopmentGithub,
} from "@/lib/apply/committee"
import { useOpenPositions } from "@/lib/api"
import type { ApplicantApplication } from "@/lib/api/applicant"
import { groupedCommitteesForPicker } from "@/lib/apply/committee-groups"

type ChoicePair = { committee: string; positionId: string }

function positionTitle(
  positions: { id: string; title: string }[],
  positionId: string,
) {
  return positions.find((position) => position.id === positionId)?.title ?? ""
}

export function choiceEditorCanSubmit(input: {
  firstPositionId: string
  secondPositionId: string
  needsSlot: boolean
  slotId: string
  showPortfolio: boolean
  portfolioUrl: string
  showGithub: boolean
  githubUrl: string
}) {
  if (!input.firstPositionId || !input.secondPositionId) return false
  if (input.firstPositionId === input.secondPositionId) return false
  if (input.needsSlot && !input.slotId) return false
  if (input.showPortfolio && !isValidGoogleDriveUrl(input.portfolioUrl)) return false
  if (
    input.showGithub &&
    input.githubUrl.trim() &&
    !isValidGithubUrl(input.githubUrl)
  ) {
    return false
  }
  return true
}

export function useApplicantChoiceEditorState(
  application: ApplicantApplication,
  slotId: string,
  onPreviewPositionIdChange: (positionId: string | undefined) => void,
) {
  const first = application.choices.find((choice) => choice.preferenceRank === 1)
  const second = application.choices.find((choice) => choice.preferenceRank === 2)
  const { positions: openPositions, loading } = useOpenPositions()
  const positions = useMemo(() => {
    const available = new Map(
      openPositions.map((position) => [position.id, position]),
    )
    for (const choice of application.choices) {
      if (available.has(choice.positionId)) continue
      available.set(choice.positionId, {
        id: choice.positionId,
        committee: choice.committee,
        committee_id: choice.committeeId,
        acceptingApplications: false,
        title: choice.title,
        description: "",
      })
    }
    return [...available.values()]
  }, [application.choices, openPositions])
  const committees = useMemo(
    () => [...new Set(positions.map((position) => position.committee))],
    [positions],
  )
  const groups = groupedCommitteesForPicker(committees)

  const [firstCommittee, setFirstCommittee] = useState(first?.committee ?? "")
  const [firstPositionId, setFirstPositionId] = useState(first?.positionId ?? "")
  const [secondCommittee, setSecondCommittee] = useState(second?.committee ?? "")
  const [secondPositionId, setSecondPositionId] = useState(second?.positionId ?? "")
  const [portfolioUrl, setPortfolioUrl] = useState(application.portfolioUrl ?? "")
  const [githubUrl, setGithubUrl] = useState(application.githubUrl ?? "")

  const showPortfolio = needsCreativesPortfolio(firstCommittee, secondCommittee)
  const showGithub = needsDevelopmentGithub(
    firstCommittee,
    secondCommittee,
    positionTitle(positions, firstPositionId),
    positionTitle(positions, secondPositionId),
  )
  const savedFirstCommittee = first?.committee ?? ""
  const firstChoiceCommitteeChanged =
    Boolean(savedFirstCommittee) && firstCommittee !== savedFirstCommittee
  const needsSlot = firstChoiceCommitteeChanged && Boolean(firstPositionId)

  const canSubmit = useMemo(
    () =>
      choiceEditorCanSubmit({
        firstPositionId,
        secondPositionId,
        needsSlot,
        slotId,
        showPortfolio,
        portfolioUrl,
        showGithub,
        githubUrl,
      }),
    [
      firstPositionId,
      githubUrl,
      needsSlot,
      portfolioUrl,
      secondPositionId,
      showGithub,
      showPortfolio,
      slotId,
    ],
  )

  function applyChoice(rank: 1 | 2, next: ChoicePair) {
    if (rank === 1) {
      const firstChoiceChanged =
        next.committee !== firstCommittee || next.positionId !== firstPositionId
      if (firstChoiceChanged) {
        const previewForNewCommittee =
          next.committee !== savedFirstCommittee ? next.positionId : undefined
        onPreviewPositionIdChange(previewForNewCommittee)
      }
      setFirstCommittee(next.committee)
      setFirstPositionId(next.positionId)
    } else {
      setSecondCommittee(next.committee)
      setSecondPositionId(next.positionId)
    }
    const nextFirst = rank === 1 ? next.committee : firstCommittee
    const nextSecond = rank === 2 ? next.committee : secondCommittee
    const nextFirstId = rank === 1 ? next.positionId : firstPositionId
    const nextSecondId = rank === 2 ? next.positionId : secondPositionId
    if (!needsCreativesPortfolio(nextFirst, nextSecond)) {
      setPortfolioUrl("")
    }
    if (
      !needsDevelopmentGithub(
        nextFirst,
        nextSecond,
        positionTitle(positions, nextFirstId),
        positionTitle(positions, nextSecondId),
      )
    ) {
      setGithubUrl("")
    }
  }

  return {
    groups,
    positions,
    loading,
    firstCommittee,
    firstPositionId,
    secondCommittee,
    secondPositionId,
    portfolioUrl,
    setPortfolioUrl,
    githubUrl,
    setGithubUrl,
    showPortfolio,
    showGithub,
    needsSlot,
    canSubmit,
    applyChoice,
  }
}
