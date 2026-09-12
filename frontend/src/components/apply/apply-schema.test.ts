import assert from "node:assert/strict"
import test from "node:test"
import { applySchema, applyFormDefaults } from "./apply-schema"

function file(name: string, size = 10_000_000) {
  return new File([new Uint8Array(size)], name, { type: "application/pdf" })
}

function validForm() {
  return {
    ...applyFormDefaults,
    privacy: { dataPrivacyAgreed: true },
    general: {
      firstName: "Juan", lastName: "Dela Cruz", age: "21", birthday: "2005-04-12", gender: "male",
      section: "4CSC", emailLocal: "juan", studentNumber: "2026123456", contactDigits: "9171234567",
      facebookUrl: "https://facebook.com/juan.delacruz",
    },
    committee: {
      firstCommittee: "Development Committee", firstPositionId: "first", secondCommittee: "Logistics Committee",
      secondPositionId: "second", motivation: "I want to join.", slotId: "slot", portfolioUrl: "", githubUrl: "",
    },
    upload: {
      resume: file("CV_delacruz.pdf"), transcript: file("TOR_delacruz.pdf"), registration: file("RegForm_delacruz.pdf"),
    },
  }
}

test("apply schema accepts the exact 10,000,000-byte boundary", () => {
  const result = applySchema.safeParse(validForm())
  assert.equal(result.success, true, result.success ? "" : JSON.stringify(result.error.issues))
})

test("apply schema rejects 10,000,001-byte PDFs with the existing message", () => {
  const values = validForm()
  values.upload.resume = file("CV_delacruz.pdf", 10_000_001)
  const result = applySchema.safeParse(values)
  assert.equal(result.success, false)
  if (!result.success) assert.ok(result.error.issues.some((issue) => issue.message === "Each PDF must be 10 MB or smaller."))
})

test("apply schema validates document names against the applicant last name", () => {
  const values = validForm()
  values.upload.registration = file("registration.pdf")
  const result = applySchema.safeParse(values)
  assert.equal(result.success, false)
  if (!result.success) assert.ok(result.error.issues.some((issue) => issue.message.includes("RegForm_Lastname.pdf")))
})
