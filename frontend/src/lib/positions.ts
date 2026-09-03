export type Position = {
  id: string
  title: string
  office: string
  committee: string
  committeeDescription: string
  description: string
  responsibilities: string[]
  isOpen: boolean
}

export function groupPositionsByOffice(positions: Position[]) {
  const groups: { office: string; positions: Position[] }[] = []

  for (const position of positions) {
    const existing = groups.find((group) => group.office === position.office)

    if (existing) {
      existing.positions.push(position)
    } else {
      groups.push({
        office: position.office,
        positions: [position],
      })
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
  return isAssistantRole(position) ? 1 : 4
}
