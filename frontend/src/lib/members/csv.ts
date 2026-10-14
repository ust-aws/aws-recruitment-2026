import { escapeCell } from "@/lib/hr/applications-csv"
import { academicDetailsFromSection } from "@/lib/apply/academic-details"
import type { MemberEntry } from "@/lib/members/directory"
import { ROLE_LABELS } from "@/lib/members/directory"
import type { UnpaidEntry } from "@/lib/members/unpaid"
import { UNPAID_FILTER_LABELS } from "@/lib/members/unpaid"

function toCsv(headers: string[], rows: (string | null)[][]) {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n")
}

export function membersToCsv(entries: MemberEntry[]) {
  return toCsv(
    ["Full name", "Birthday", "Gender", "Facebook link", "Year level", "Course", "Section", "Position", "Role", "Committee", "Member ID", "Student number", "ID issued"],
    entries.map((entry) => {
      const academic = academicDetailsFromSection(entry.section)
      return [
        entry.fullName,
        entry.birthday,
        entry.gender,
        entry.facebookUrl,
        academic.yearLevel,
        academic.course,
        entry.section,
        entry.position,
        ROLE_LABELS[entry.role],
        entry.committee,
        entry.memberId,
        entry.studentNumber,
        entry.issuedAt,
      ]
    }),
  )
}

export function unpaidToCsv(entries: UnpaidEntry[]) {
  return toCsv(
    ["Full name", "Email", "Birthday", "Gender", "Facebook link", "Year level", "Course", "Section", "Position", "Committee", "Payment status", "Pay by", "Last reference sent"],
    entries.map((entry) => {
      const academic = academicDetailsFromSection(entry.section)
      return [
        entry.fullName,
        entry.email,
        entry.birthday,
        entry.gender,
        entry.facebookUrl,
        academic.yearLevel,
        academic.course,
        entry.section,
        entry.position,
        entry.committee,
        UNPAID_FILTER_LABELS[entry.status],
        entry.dueAt,
        entry.lastSubmittedAt,
      ]
    }),
  )
}
