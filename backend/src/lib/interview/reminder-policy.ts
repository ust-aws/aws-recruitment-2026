const ONE_HOUR_MS = 60 * 60 * 1000;
export const INTERVIEW_REMINDER_LOOKAHEAD_MS = 24 * ONE_HOUR_MS;

export type InterviewReminderKind = "24h" | "1h";

export function dueInterviewReminder(input: {
  startsAt: Date;
  reminder24hSentAt: Date | null;
  reminder1hSentAt: Date | null;
  now: Date;
}): InterviewReminderKind | null {
  const remaining = input.startsAt.getTime() - input.now.getTime();
  if (remaining <= 0 || remaining > INTERVIEW_REMINDER_LOOKAHEAD_MS) {
    return null;
  }
  if (remaining <= ONE_HOUR_MS) {
    return input.reminder1hSentAt ? null : "1h";
  }
  return input.reminder24hSentAt ? null : "24h";
}
