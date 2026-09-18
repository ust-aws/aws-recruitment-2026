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

export const OFFICE_CODE: Record<string, string> = {
  "Office of the Chief Executive Officer": "ceo",
  "Office of the Chief Finance Officer": "cfo",
  "Office of the Corporate Secretary": "sec",
  "Office of the Chief Relations Officer": "cro",
  "Office of the Chief Creative Officer": "cco",
  "Office of the Chief Operating Officer": "coo",
  "Office of the Chief Technology Officer": "cto",
  "Office of the Chief Human Resources Officer": "chro",
}

export function isAssistantRole(position: Position) {
  return position.title.startsWith("Executive Assistant")
}

export function openSpots(position: Position) {
  return position.openSlots
}
