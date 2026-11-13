import { and, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "../../db";
import { membershipPaymentSubmissions, membershipPayments } from "../../db/schema";
import { MembershipPaymentError } from "./errors";

/** Statuses that still owe a payment ("expired" only as saved by older code). */
const OWING = ["awaiting_payment", "needs_resubmission", "expired"] as const;

/**
 * Quietly lets the people HR ticked pay until `until`, even after the payment
 * period closes or its deadline passes. No email is sent; it only touches
 * people who still owe, so anyone paid or under review is left alone.
 */
export async function allowLatePayment(paymentIds: string[], until: Date) {
  if (until <= new Date()) {
    throw new MembershipPaymentError("Pick a date that has not passed yet.");
  }
  const hadRejection = sql`exists (
    select 1 from ${membershipPaymentSubmissions}
    where ${membershipPaymentSubmissions.paymentId} = ${membershipPayments.id}
      and ${membershipPaymentSubmissions.status} in ('rejected', 'reversed')
  )`;
  const opened = await db
    .update(membershipPayments)
    .set({
      personalDeadlineAt: until,
      // A status older code saved as expired would otherwise keep them out.
      status: sql`case when ${membershipPayments.status} <> 'expired' then ${membershipPayments.status}
        when ${hadRejection} then 'needs_resubmission'::membership_payment_status
        else 'awaiting_payment'::membership_payment_status end`,
      updatedAt: new Date(),
    })
    .where(and(inArray(membershipPayments.id, paymentIds), inArray(membershipPayments.status, [...OWING])))
    .returning({ id: membershipPayments.id });
  return { opened: opened.length, skipped: paymentIds.length - opened.length };
}

/**
 * Takes back a late payment: they are back on the period's own dates, so they
 * can no longer pay if it is closed or past its deadline. No email is sent.
 */
export async function closeLatePayment(paymentIds: string[]) {
  const closed = await db
    .update(membershipPayments)
    .set({ personalDeadlineAt: null, updatedAt: new Date() })
    .where(
      and(
        inArray(membershipPayments.id, paymentIds),
        inArray(membershipPayments.status, [...OWING]),
        isNotNull(membershipPayments.personalDeadlineAt),
      ),
    )
    .returning({ id: membershipPayments.id });
  return { closed: closed.length };
}
