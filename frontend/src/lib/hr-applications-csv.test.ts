import assert from "node:assert/strict"
import test from "node:test"
import { applicationsToCsv } from "./hr-applications-csv"
import type { HrApplication } from "./hr-application-types"

const application: HrApplication = {
  id: "11111111-1111-4111-8111-111111111111",
  applicationCode: "AP-2026-123456",
  status: "pending",
  submittedAt: "2026-09-11T08:00:00.000Z",
  archivedAt: null,
  firstName: "=Formula",
  lastName: "Tester",
  email: "formula.tester@ust.edu.ph",
  age: 20,
  birthday: "2006-01-01",
  gender: "female",
  section: "3CSC",
  studentNumber: "2026123456",
  contactNumber: "+639171234567",
  facebookUrl: "https://facebook.com/formula.tester",
  motivation: "Test export",
  portfolioUrl: "https://drive.google.com/private-portfolio",
  githubUrl: "https://github.com/formula-tester",
  choices: [
    {
      preferenceRank: 1,
      positionId: "22222222-2222-4222-8222-222222222222",
      committee: "Operations, and Finance",
      title: 'Lead "Builder"',
      decisionStatus: "approved",
    },
    {
      preferenceRank: 2,
      positionId: "33333333-3333-4333-8333-333333333333",
      committee: "Technology",
      title: "Developer",
      decisionStatus: "pending",
    },
  ],
  finalPlacement: {
    positionId: "22222222-2222-4222-8222-222222222222",
    committee: "Operations, and Finance",
    title: 'Lead "Builder"',
  },
  documents: [
    {
      documentType: "resume",
      fileName: "resume.pdf",
      s3Key: "private/applications/resume.pdf",
    },
  ],
}

test("exports only allowed fields and escapes spreadsheet input", () => {
  const csv = applicationsToCsv([application])

  assert.equal(csv.split("\r\n").length, 2)
  assert.match(csv, /"'=Formula Tester"/)
  assert.match(csv, /"Operations, and Finance"/)
  assert.match(csv, /"Lead ""Builder"""/)
  assert.ok(!csv.includes("private/applications"))
  assert.ok(!csv.includes("resume.pdf"))
  assert.ok(!csv.includes("facebook.com"))
  assert.ok(!csv.includes("drive.google.com"))
  assert.ok(!csv.includes("github.com"))
})
