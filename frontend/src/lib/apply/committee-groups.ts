export type CommitteeOfficeGroup = {
  office: string
  committees: readonly string[]
}

/** Office headers and committee names aligned with seeded position data. */
export const COMMITTEE_OFFICE_GROUPS: CommitteeOfficeGroup[] = [
  {
    office: "Chief Executive Officer",
    committees: ["Office of the Chief Executive Officer"],
  },
  {
    office: "Chief Operating Officer",
    committees: [
      "Office of the Chief Operating Officer",
      "Logistics Committee",
      "Community Development Committee",
    ],
  },
  {
    office: "Chief Relations Officer",
    committees: [
      "Office of the Chief Relations Officer",
      "Sponsorship Committee",
      "Marketing Committee",
      "External Affairs Committee",
    ],
  },
  {
    office: "Corporate Secretary",
    committees: [
      "Office of the Corporate Secretary",
      "Secretariat Committee",
    ],
  },
  {
    office: "Chief Technology Officer",
    committees: [
      "Office of the Chief Technology Officer",
      "Technicals Committee",
      "Development Committee",
    ],
  },
  {
    office: "Chief Finance Officer",
    committees: ["Office of the Chief Finance Officer", "Finance Committee"],
  },
  {
    office: "Chief Human Resources Officer",
    committees: [
      "Office of the Chief Human Resources Officer",
      "Human Resources Committee",
    ],
  },
  {
    office: "Chief Creatives Officer",
    committees: [
      "Office of the Chief Creative Officer",
      "Documentation Committee",
      "Media Committee",
      "Publicity Committee",
    ],
  },
]

export function groupedCommitteesForPicker(available: string[]) {
  const open = new Set(available)
  const grouped: { office: string; committees: string[] }[] = []
  for (const group of COMMITTEE_OFFICE_GROUPS) {
    const committees = group.committees.filter((committee) => open.has(committee))
    if (committees.length > 0) {
      grouped.push({ office: group.office, committees })
    }
  }
  return grouped
}

export function officeForCommittee(committee: string) {
  return (
    COMMITTEE_OFFICE_GROUPS.find((group) =>
      group.committees.includes(committee)
    )?.office ?? ""
  )
}

/** Landing-page committee card titles keyed by seeded committee name. */
const LANDING_COMMITTEE_TITLE_BY_SEED: Record<string, string> = {
  "Sponsorship Committee": "Sponsorships",
  "Marketing Committee": "Marketing",
  "External Affairs Committee": "External Affairs",
  "Logistics Committee": "Logistics",
  "Community Development Committee": "Community Development",
  "Secretariat Committee": "Secretariat",
  "Technicals Committee": "Technical",
  "Development Committee": "Development",
  "Finance Committee": "Finance",
  "Human Resources Committee": "Human Resources",
  "Documentation Committee": "Documentation",
  "Media Committee": "Media",
  "Publicity Committee": "Publication",
}

/** Seeded committee names in executive-office hierarchy (CEO → CCO), excluding EB offices. */
export function staffCommitteeSeedNamesInOrgOrder(): string[] {
  const names: string[] = []
  for (const group of COMMITTEE_OFFICE_GROUPS) {
    for (const committee of group.committees) {
      if (committee.startsWith("Office of the ")) continue
      names.push(committee)
    }
  }
  return names
}

/** Staff committee card titles in executive-office hierarchy (CEO → CCO). */
export function landingCommitteeCardOrder(): string[] {
  return staffCommitteeSeedNamesInOrgOrder().map(
    (committee) => LANDING_COMMITTEE_TITLE_BY_SEED[committee] ?? committee,
  )
}
