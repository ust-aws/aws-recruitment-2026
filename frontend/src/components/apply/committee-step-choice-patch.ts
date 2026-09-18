import {
  needsCreativesPortfolio,
  needsDevelopmentGithub,
} from "@/lib/apply/committee"
import type { CommitteeValues } from "@/components/apply/apply-schema"

export const memberChoicePatch: Partial<CommitteeValues> = {
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

export function buildCommitteeChoicePatch(
  rank: 1 | 2,
  next: { committee: string; positionId: string },
  values: CommitteeValues,
  positionTitle: (positionId: string) => string,
): Partial<CommitteeValues> {
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
  return patch
}
