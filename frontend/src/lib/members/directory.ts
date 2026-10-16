import { staffCommitteeSeedNamesInOrgOrder } from "@/lib/apply/committee-groups"
import type { DirectoryMember, PendingOfficer } from "@/lib/api/payments"
import { COMMITTEE_DIRECTORS, EXECUTIVE_BOARD } from "@/lib/people"

export type MemberFilter = "all" | "eb" | "ea" | "director" | "staff" | "general" | "adviser"

/** One row in the HR Members list. Officers who have not paid hold a reserved number, not an ID. */
export type MemberEntry = {
  key: string
  fullName: string
  birthday: string | null
  gender: string | null
  facebookUrl: string | null
  position: string
  role: Exclude<MemberFilter, "all">
  /** The executive office or committee this person belongs to; null for general members. */
  committee: string | null
  memberId: string | null
  /** The number held for an officer's seat until they pay; null for everyone else. */
  reservedMemberId: string | null
  studentNumber: string | null
  section: string | null
  /** When the Member ID was issued (the payment was verified); null when there is no ID. */
  issuedAt: string | null
}

export const ROLE_LABELS: Record<Exclude<MemberFilter, "all">, string> = {
  eb: "Executive Board",
  ea: "Executive Associate",
  director: "Director",
  staff: "Staff",
  general: "General Member",
  adviser: "Adviser",
}

export const FILTER_LABELS: Record<MemberFilter, string> = {
  all: "Everyone",
  eb: "Executive Board",
  ea: "Executive Associates",
  director: "Directors",
  staff: "Staff",
  general: "General Members",
  adviser: "Advisers",
}

/** Executive Board seat id to the executive office it heads. */
const OFFICE_BY_EB_SEAT: Record<string, string> = {
  ceo: "Office of the Chief Executive Officer",
  coo: "Office of the Chief Operating Officer",
  cro: "Office of the Chief Relations Officer",
  "corp-sec": "Office of the Corporate Secretary",
  cto: "Office of the Chief Technology Officer",
  cfo: "Office of the Chief Finance Officer",
  chro: "Office of the Chief Human Resources Officer",
  cco: "Office of the Chief Creative Officer",
}

/** Fallback before officers are seeded: this year's board and directors from the public people list. */
function staticOfficerEntries(): MemberEntry[] {
  const officer = (
    id: string,
    role: "eb" | "director",
    committee: string | null,
    person: { name: string; title: string },
  ): MemberEntry => ({
    key: id,
    fullName: person.name,
    birthday: null,
    gender: null,
    facebookUrl: null,
    position: person.title,
    role,
    committee,
    memberId: null,
    reservedMemberId: null,
    studentNumber: null,
    section: null,
    issuedAt: null,
  })
  // Director seats are built in the same order as the staff committees.
  const committees = staffCommitteeSeedNamesInOrgOrder()
  return [
    ...EXECUTIVE_BOARD.map((seat) =>
      officer(`eb-${seat.id}`, "eb", OFFICE_BY_EB_SEAT[seat.id] ?? null, seat.current),
    ),
    ...COMMITTEE_DIRECTORS.map((seat, index) =>
      officer(seat.id, "director", committees[index] ?? null, seat.current),
    ),
  ]
}

function pendingOfficerEntry(officer: PendingOfficer): MemberEntry {
  return {
    key: `pending-${officer.applicationCode}`,
    fullName: officer.fullName,
    birthday: officer.birthday,
    gender: officer.gender,
    facebookUrl: officer.facebookUrl,
    position: officer.position,
    role: officer.role,
    committee: officer.committee,
    memberId: null,
    reservedMemberId: officer.reservedMemberId,
    studentNumber: officer.studentNumber,
    section: officer.section,
    issuedAt: null,
  }
}

/**
 * Everyone with an active Member ID first, in ID order (paid officers and
 * advisers included), then the board and directors who have not paid yet,
 * each showing the number held for their seat.
 */
export function buildMemberEntries(
  verified: DirectoryMember[],
  pendingOfficers: PendingOfficer[] = [],
): MemberEntry[] {
  const seeded = pendingOfficers.length > 0 || verified.some((member) => member.role === "eb" || member.role === "director")
  return [
    ...verified.map((member) => ({
      key: member.memberId,
      fullName: member.fullName,
      birthday: member.birthday,
      gender: member.gender,
      facebookUrl: member.facebookUrl,
      position: member.position,
      role: member.role,
      committee: member.committee,
      memberId: member.memberId,
      reservedMemberId: null,
      studentNumber: member.studentNumber,
      section: member.section,
      issuedAt: member.verifiedAt,
    })),
    ...(seeded ? pendingOfficers.map(pendingOfficerEntry) : staticOfficerEntries()),
  ]
}

export function countByFilter(entries: MemberEntry[]): Record<MemberFilter, number> {
  const counts: Record<MemberFilter, number> = { all: entries.length, eb: 0, ea: 0, director: 0, staff: 0, general: 0, adviser: 0 }
  for (const entry of entries) counts[entry.role] += 1
  return counts
}

/** People with a Member ID, versus officers who are listed without one. */
export function splitByMemberId(entries: MemberEntry[]) {
  const withId = entries.filter((entry) => entry.memberId !== null).length
  return { withId, officers: entries.length - withId }
}

export function filterMemberEntries(entries: MemberEntry[], filter: MemberFilter, query: string) {
  const needle = query.trim().toLowerCase()
  return entries.filter((entry) => {
    if (filter !== "all" && entry.role !== filter) return false
    if (!needle) return true
    return [entry.fullName, entry.position, entry.committee ?? "", entry.memberId ?? "", entry.reservedMemberId ?? "", entry.studentNumber ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  })
}
