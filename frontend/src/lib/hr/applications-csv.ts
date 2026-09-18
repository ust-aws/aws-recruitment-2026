import type { HrApplication } from "@/lib/types/hr-application"

const HEADERS = [
  "Application ID",
  "Full name",
  "Email",
  "Student number",
  "Section",
  "Contact number",
  "Application status",
  "Archive status",
  "First-choice committee",
  "First-choice position",
  "First-choice decision",
  "Second-choice committee",
  "Second-choice position",
  "Second-choice decision",
  "Final committee",
  "Final position",
  "Submitted at",
]
const FORMULA_PREFIX = /^[=+\-@\t\r]/

function escapeCell(value: string | null | undefined) {
  const text = value ?? ""
  const safeText = FORMULA_PREFIX.test(text) ? `'${text}` : text
  return `"${safeText.replaceAll('"', '""')}"`
}

export function applicationsToCsv(applications: HrApplication[]) {
  const rows = applications.map((application) => {
    let first: (typeof application.choices)[number] | undefined
    let second: (typeof application.choices)[number] | undefined
    for (const choice of application.choices) {
      if (choice.preferenceRank === 1) first = choice
      if (choice.preferenceRank === 2) second = choice
    }
    return [
      application.applicationCode,
      `${application.firstName} ${application.lastName}`,
      application.email,
      application.studentNumber,
      application.section,
      application.contactNumber,
      application.status,
      application.archivedAt ? "Archived" : "Active",
      first?.committee,
      first?.title,
      first?.decisionStatus,
      second?.committee,
      second?.title,
      second?.decisionStatus,
      application.finalPlacement?.committee,
      application.finalPlacement?.title,
      application.submittedAt,
    ]
  })

  return [HEADERS, ...rows]
    .map((row) => row.map((value) => escapeCell(value)).join(","))
    .join("\r\n")
}
