import { COMMITTEE_OFFICE_GROUPS } from "@/lib/committee-groups"

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
  secondCommittee: string
): boolean {
  return (
    isDevelopmentCommittee(firstCommittee) ||
    isDevelopmentCommittee(secondCommittee)
  )
}
