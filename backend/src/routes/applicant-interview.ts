import { Hono } from "hono";
import {
  getApplicantSession,
  requireApplicantAuth,
} from "../applicant-auth";
import { unavailableApiError } from "../lib/core/api-errors";
import { fireInterviewRescheduleNotification } from "../lib/email/service";
import {
  INTERVIEW_CALENDAR_FILENAME,
  interviewCalendarAttachment,
} from "../lib/email/interview-calendar";
import {
  bookApplicantInterview,
  getApplicantInterviewSchedule,
  getBookedInterviewBooking,
  InterviewScheduleError,
} from "../lib/interview/scheduling";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function schedulingError(error: unknown) {
  if (!(error instanceof InterviewScheduleError)) throw error;
  const status =
    error.code === "application_not_found" ||
    error.code === "position_not_found" ||
    error.code === "slot_not_found"
      ? 404
      : 409;
  return { body: { error: error.message }, status } as const;
}

export const applicantInterviewRoutes = new Hono();

applicantInterviewRoutes.use("*", requireApplicantAuth);

applicantInterviewRoutes.get("/interview-slots", async (c) => {
  const positionId = c.req.query("positionId");
  if (positionId && !isUuid(positionId)) {
    return c.json({ error: "positionId must be a UUID." }, 400);
  }

  const session = getApplicantSession(c);
  try {
    const schedule = await getApplicantInterviewSchedule(
      session.applicationId,
      positionId || undefined,
    );
    return c.json(schedule);
  } catch (error) {
    if (error instanceof InterviewScheduleError) {
      const result = schedulingError(error);
      return c.json(result.body, result.status);
    }
    return unavailableApiError(
      c,
      error,
      "applicant interview slots",
      "Interview scheduling is temporarily unavailable. Try again in a moment.",
    );
  }
});

applicantInterviewRoutes.get("/interview-calendar", async (c) => {
  const session = getApplicantSession(c);
  try {
    const schedule = await getApplicantInterviewSchedule(
      session.applicationId,
    );
    if (!schedule.booking) {
      return c.json({ error: "No interview has been booked." }, 404);
    }

    const attachment = interviewCalendarAttachment({
      applicationCode: session.applicationCode,
      committeeName: schedule.committee.name,
      startsAt: new Date(schedule.booking.startsAt),
      endsAt: new Date(schedule.booking.endsAt),
    });
    c.header("Cache-Control", "no-store");
    c.header("Content-Type", attachment.mimeType);
    c.header(
      "Content-Disposition",
      `attachment; filename="${INTERVIEW_CALENDAR_FILENAME}"`,
    );
    return c.body(attachment.content.toString("utf8"));
  } catch (error) {
    if (error instanceof InterviewScheduleError) {
      const result = schedulingError(error);
      return c.json(result.body, result.status);
    }
    return unavailableApiError(
      c,
      error,
      "applicant interview calendar",
      "Could not create your calendar invite. Try again in a moment.",
    );
  }
});

applicantInterviewRoutes.put("/interview-booking", async (c) => {
  const body = await c.req.json().catch(() => null);
  const slotId =
    body && typeof body === "object"
      ? (body as Record<string, unknown>).slotId
      : undefined;
  if (typeof slotId !== "string" || !isUuid(slotId)) {
    return c.json({ error: "slotId must be a UUID." }, 400);
  }

  const session = getApplicantSession(c);
  const previousBooking = await getBookedInterviewBooking(
    session.applicationId,
  );
  try {
    const booking = await bookApplicantInterview(
      session.applicationId,
      slotId,
    );
    if (previousBooking?.slotId !== booking.slotId) {
      fireInterviewRescheduleNotification(
        session.applicationId,
        previousBooking?.startsAt ?? null,
      );
    }
    return c.json({ booking });
  } catch (error) {
    if (error instanceof InterviewScheduleError) {
      const result = schedulingError(error);
      return c.json(result.body, result.status);
    }
    return unavailableApiError(
      c,
      error,
      "applicant interview booking",
      "Could not confirm your interview slot. Try again in a moment.",
    );
  }
});
