import assert from "node:assert/strict"
import test from "node:test"
import type { PaymentCampaign, PaymentListItem } from "../api/payments"
import {
  EMPTY_PAYMENT_FILTERS,
  defaultPaymentTab,
  needsPaymentSetup,
  filterPayments,
  matchesPaymentEmail,
  paymentEmailCounts,
  nextAfterDecision,
  periodLine,
  reviewQueue,
  sortPayments,
  stepInList,
} from "./workspace"

function payment(id: string, patch: Partial<PaymentListItem> = {}): PaymentListItem {
  return {
    paymentId: id,
    applicationId: `app-${id}`,
    applicationCode: `AP-2026-${id}`,
    applicationType: "position",
    applicationStatus: "approved",
    archivedAt: null,
    memberId: null,
    firstName: "Test",
    lastName: id,
    email: `${id}@ust.edu.ph`,
    birthday: null,
    gender: null,
    section: null,
    facebookUrl: null,
    status: "pending_verification",
    membershipStatus: "inactive",
    verifiedAt: null,
    resubmissionDeadlineAt: null,
    deadlineAt: "2026-10-20T15:59:00.000Z",
    finalPosition: null,
    committee: "Creatives",
    latestSubmission: {
      id: `s-${id}`,
      attemptNumber: 1,
      method: "gcash",
      referenceNumber: `REF${id}`,
      status: "pending",
      submittedAt: "2026-10-10T00:00:00.000Z",
      reviewReason: null,
    },
    invitation: "sent",
    ...patch,
  }
}

const submittedAt = (iso: string) => ({ latestSubmission: { ...payment("x").latestSubmission!, submittedAt: iso } })

test("the review queue holds only pending receipts, oldest submission first", () => {
  const queue = reviewQueue([
    payment("b", submittedAt("2026-10-12T00:00:00.000Z")),
    payment("v", { status: "verified" }),
    payment("a", submittedAt("2026-10-11T00:00:00.000Z")),
  ])
  assert.deepEqual(queue.map((item) => item.paymentId), ["a", "b"])
})

test("after a decision the panel moves to the next receipt, else the previous, else closes", () => {
  const queue = [payment("a"), payment("b"), payment("c")]
  assert.equal(nextAfterDecision(queue, "b"), "c")
  assert.equal(nextAfterDecision(queue, "c"), "b")
  assert.equal(nextAfterDecision([payment("a")], "a"), null)
  assert.equal(stepInList(queue, "a", -1), null)
})

test("filters search names, codes and references; the list sorts work first", () => {
  const rows = [payment("a", { status: "verified" }), payment("b"), payment("c", { applicationType: "member", committee: null })]
  assert.deepEqual(filterPayments(rows, { ...EMPTY_PAYMENT_FILTERS, query: "refb" }).map((r) => r.paymentId), ["b"])
  assert.deepEqual(filterPayments(rows, { ...EMPTY_PAYMENT_FILTERS, type: "member" }).map((r) => r.paymentId), ["c"])

  // The payment email: who has not been sent theirs, and who might not have received it.
  const emailRows = [
    payment("sent"),
    payment("none", { invitation: "none" }),
    payment("queued", { invitation: "queued" }),
    payment("failed", { invitation: "failed" }),
    payment("unsure", { invitation: "uncertain" }),
  ]
  const emailIds = (email: "all" | "unsent" | "uncertain" | "sent") =>
    emailRows.filter((row) => matchesPaymentEmail(row, email)).map((r) => r.paymentId)
  assert.deepEqual(emailIds("unsent"), ["none", "queued", "failed"])
  assert.deepEqual(emailIds("uncertain"), ["unsure"])
  assert.deepEqual(emailIds("sent"), ["sent"])
  assert.equal(emailIds("all").length, 5)
  assert.deepEqual(paymentEmailCounts(emailRows), { unsent: 3, uncertain: 1, sent: 1 })
  // Someone who already paid has no use for the invitation, so they are never listed as not sent.
  assert.equal(paymentEmailCounts([payment("paid", { invitation: "none", status: "verified" })]).unsent, 0)
  assert.deepEqual(sortPayments(rows).map((r) => r.paymentId), ["b", "c", "a"])
})

test("the page opens on the queue while receipts wait, and says where the period stands", () => {
  const summary = { totalEligible: 3, awaitingPayment: 0, pendingVerification: 2, verified: 1, needsResubmission: 0, expired: 0 }
  const campaign = { isOpen: true, amountCents: 25000, deadlineAt: "2026-10-20T15:59:00.000Z" } as PaymentCampaign
  assert.equal(defaultPaymentTab(summary), "review")
  assert.equal(defaultPaymentTab({ ...summary, pendingVerification: 0 }), "all")
  assert.equal(defaultPaymentTab(null), "all")
  assert.equal(needsPaymentSetup(null), true)
  assert.equal(needsPaymentSetup({ ...campaign, amountCents: null }), true)
  assert.equal(needsPaymentSetup(campaign), false)
  assert.match(periodLine(campaign), /^Open · ₱250\.00 · deadline Oct 20, 2026$/)
})
