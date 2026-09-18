import { COMMITTEE_OFFICE_GROUPS } from "@/lib/apply/committee-groups"

const CREATIVES_COMMITTEES = new Set(
  COMMITTEE_OFFICE_GROUPS.find((g) => g.office === "Chief Creatives Officer")
    ?.committees ?? []
)

export function isCreativesCommittee(name: string): boolean {
  return CREATIVES_COMMITTEES.has(name)
}

export function isDevelopmentCommittee(name: string): boolean {
  return name === "Development Committee"
}

export const CTO_EA_POSITION_TITLE = "Executive Assistant to the CTO"

export function isCtoExecutiveAssistant(title: string): boolean {
  return title === CTO_EA_POSITION_TITLE
}

export function needsCreativesPortfolio(
  firstCommittee: string,
  secondCommittee: string
): boolean {
  return (
    isCreativesCommittee(firstCommittee) ||
    isCreativesCommittee(secondCommittee)
  )
}

export function needsDevelopmentGithub(
  firstCommittee: string,
  secondCommittee: string,
  firstTitle = "",
  secondTitle = ""
): boolean {
  return (
    isDevelopmentCommittee(firstCommittee) ||
    isDevelopmentCommittee(secondCommittee) ||
    isCtoExecutiveAssistant(firstTitle) ||
    isCtoExecutiveAssistant(secondTitle)
  )
}

export function needsDevExamSuccessCopy(
  firstCommittee: string,
  secondCommittee: string,
  firstTitle = "",
  secondTitle = ""
): { development: boolean; ctoEa: boolean } {
  return {
    development:
      isDevelopmentCommittee(firstCommittee) ||
      isDevelopmentCommittee(secondCommittee),
    ctoEa:
      isCtoExecutiveAssistant(firstTitle) ||
      isCtoExecutiveAssistant(secondTitle),
  }
}
