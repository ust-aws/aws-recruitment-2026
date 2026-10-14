import type { PaymentListItem, PaymentStatus } from "@/lib/api/payments"

export type UnpaidStatus = Exclude<PaymentStatus, "verified">
export type UnpaidFilter = "all" | UnpaidStatus

/** One person who is eligible for membership but whose payment is not verified yet. */
export type UnpaidEntry = {
  key: string
  fullName: string
  email: string
  birthday: string | null
  gender: string | null
  section: string | null
  facebookUrl: string | null
  position: string
  committee: string | null
  status: UnpaidStatus
  /** The date they must pay by; a resubmission has its own, later deadline. */
  dueAt: string
  /** When they last sent a payment reference, if they have. */
  lastSubmittedAt: string | null
}

export const UNPAID_FILTER_LABELS: Record<UnpaidFilter, string> = {
  all: "Everyone not paid",
  awaiting_payment: "Awaiting payment",
  pending_verification: "Waiting for verification",
  needs_resubmission: "Needs resubmission",
  expired: "Expired",
}

/** Who to chase first: nothing sent, then a rejected receipt, then waiting on us, then lapsed. */
const STATUS_ORDER: Record<UnpaidStatus, number> = {
  awaiting_payment: 0,
  needs_resubmission: 1,
  pending_verification: 2,
  expired: 3,
}

function positionLabel(payment: PaymentListItem) {
  if (payment.finalPosition) return payment.finalPosition
  return payment.applicationType === "member" ? "General Member" : "No position yet"
}

export function buildUnpaidEntries(payments: PaymentListItem[]): UnpaidEntry[] {
  return payments
    .filter((payment): payment is PaymentListItem & { status: UnpaidStatus } =>
      payment.status !== "verified" && payment.archivedAt === null,
    )
    .map((payment) => ({
      key: payment.paymentId,
      fullName: `${payment.firstName} ${payment.lastName}`.trim(),
      email: payment.email,
      birthday: payment.birthday,
      gender: payment.gender,
      section: payment.section,
      facebookUrl: payment.facebookUrl,
      position: positionLabel(payment),
      committee: payment.committee,
      status: payment.status,
      dueAt: payment.status === "needs_resubmission" && payment.resubmissionDeadlineAt
        ? payment.resubmissionDeadlineAt
        : payment.deadlineAt,
      lastSubmittedAt: payment.latestSubmission?.submittedAt ?? null,
    }))
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.fullName.localeCompare(b.fullName))
}

export function countByUnpaidStatus(entries: UnpaidEntry[]): Record<UnpaidFilter, number> {
  const counts: Record<UnpaidFilter, number> = {
    all: entries.length,
    awaiting_payment: 0,
    pending_verification: 0,
    needs_resubmission: 0,
    expired: 0,
  }
  for (const entry of entries) counts[entry.status] += 1
  return counts
}

export function filterUnpaidEntries(entries: UnpaidEntry[], filter: UnpaidFilter, query: string) {
  const needle = query.trim().toLowerCase()
  return entries.filter((entry) => {
    if (filter !== "all" && entry.status !== filter) return false
    if (!needle) return true
    return [entry.fullName, entry.email, entry.position, entry.committee ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(needle)
  })
}
