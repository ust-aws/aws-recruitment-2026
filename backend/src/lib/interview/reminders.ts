import { and, eq, gt, isNull, lte } from "drizzle-orm";
import { db } from "../../db";
import {
  applicants,
  applications,
  committees,
  interviewBookings,
  interviewSlots,
} from "../../db/schema";
import { sendInterviewReminder } from "../email/service";
import {
  dueInterviewReminder,
  INTERVIEW_REMINDER_LOOKAHEAD_MS,
} from "./reminder-policy";

export async function sendDueInterviewReminders(now = new Date()) {
  const rows = await db
    .select({
      bookingId: interviewBookings.id,
      slotId: interviewBookings.slotId,
      applicationId: applications.id,
      applicationCode: applications.applicationCode,
      lastName: applicants.lastName,
      email: applicants.email,
      committeeName: committees.name,
      startsAt: interviewSlots.startsAt,
      reminder24hSentAt: interviewBookings.reminder24hSentAt,
      reminder1hSentAt: interviewBookings.reminder1hSentAt,
    })
    .from(interviewBookings)
    .innerJoin(
      interviewSlots,
      eq(interviewBookings.slotId, interviewSlots.id),
    )
    .innerJoin(
      applications,
      eq(interviewBookings.applicationId, applications.id),
    )
    .innerJoin(applicants, eq(applications.applicantId, applicants.id))
    .innerJoin(committees, eq(interviewSlots.committeeId, committees.id))
    .where(
      and(
        gt(interviewSlots.startsAt, now),
        lte(
          interviewSlots.startsAt,
          new Date(now.getTime() + INTERVIEW_REMINDER_LOOKAHEAD_MS),
        ),
        eq(interviewSlots.isOpen, true),
        isNull(applications.archivedAt),
        isNull(applications.resultsReleasedAt),
      ),
    );

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    const reminder = dueInterviewReminder({
      startsAt: row.startsAt,
      reminder24hSentAt: row.reminder24hSentAt,
      reminder1hSentAt: row.reminder1hSentAt,
      now,
    });
    if (!reminder) continue;

    try {
      const status = await sendInterviewReminder({
        applicationId: row.applicationId,
        applicationCode: row.applicationCode,
        lastName: row.lastName,
        email: row.email,
        committeeName: row.committeeName,
        startsAt: row.startsAt,
        reminder,
      });
      if (status !== "sent") {
        failed += 1;
        continue;
      }

      const sentAt = new Date();
      if (reminder === "24h") {
        await db
          .update(interviewBookings)
          .set({ reminder24hSentAt: sentAt })
          .where(
            and(
              eq(interviewBookings.id, row.bookingId),
              eq(interviewBookings.slotId, row.slotId),
              isNull(interviewBookings.reminder24hSentAt),
            ),
          );
      } else {
        await db
          .update(interviewBookings)
          .set({ reminder1hSentAt: sentAt })
          .where(
            and(
              eq(interviewBookings.id, row.bookingId),
              eq(interviewBookings.slotId, row.slotId),
              isNull(interviewBookings.reminder1hSentAt),
            ),
          );
      }
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error(
        `[interview-reminders] ${reminder} reminder failed for ${row.applicationCode}`,
        error,
      );
    }
  }

  return { checked: rows.length, sent, failed };
}
