import { COMMITTEE_OFFICE_GROUPS } from "@/lib/apply/committee-groups"

export type Position = {
  id: string
  title: string
  office: string
  committee: string
  committeeDescription: string
  description: string
  responsibilities: string[]
  isOpen: boolean
  acceptingApplications?: boolean
  openSlots: number
}

export type PositionCommitteeGroup = {
  committee: string
  positions: Position[]
}

export type PositionOfficeGroup = {
  office: string
  committees: PositionCommitteeGroup[]
}

export function groupPositionsByOfficeHierarchy(positions: Position[]) {
  const byCommittee = new Map<string, Position[]>()

  for (const position of positions) {
    const existing = byCommittee.get(position.committee)
    if (existing) {
      existing.push(position)
    } else {
      byCommittee.set(position.committee, [position])
    }
  }

  const groups: PositionOfficeGroup[] = []

  for (const group of COMMITTEE_OFFICE_GROUPS) {
    const committees: PositionCommitteeGroup[] = []

    for (const committee of group.committees) {
      const committeePositions = byCommittee.get(committee) ?? []
      if (committeePositions.length > 0) {
        committees.push({ committee, positions: committeePositions })
      }
    }

    if (committees.length > 0) {
      groups.push({ office: group.office, committees })
    }
  }

  return groups
}

export function isAssistantRole(position: Position) {
  return position.title.startsWith("Executive Assistant")
}

export function openSpots(position: Position) {
  return position.openSlots
}

/** Applicant-facing listings and apply flow (matches GET /positions). */
export function positionAcceptsApplicants(position: Position) {
  return (
    position.isOpen &&
    position.openSlots > 0 &&
    position.acceptingApplications !== false
  )
}
