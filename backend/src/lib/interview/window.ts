import { eq } from "drizzle-orm";
import { db } from "../../db";
import { interviewWindows, users } from "../../db/schema";

export type InterviewWindow = {
  startsAt: Date;
  endsAt: Date;
};

export type InterviewWindowPayload = {
  startsAt: string | null;
  endsAt: string | null;
};

export class InterviewWindowError extends Error {
  constructor(
    public readonly code: "invalid_range" | "invalid_timestamp" | "not_configured",
    message: string,
  ) {
    super(message);
    this.name = "InterviewWindowError";
  }
}

export async function getInterviewWindow(): Promise<InterviewWindow | null> {
  const [row] = await db
    .select({
      startsAt: interviewWindows.startsAt,
      endsAt: interviewWindows.endsAt,
    })
    .from(interviewWindows)
    .where(eq(interviewWindows.singleton, 1))
    .limit(1);

  return row ?? null;
}

export async function getInterviewWindowPayload(): Promise<InterviewWindowPayload> {
  const window = await getInterviewWindow();
  return {
    startsAt: window?.startsAt.toISOString() ?? null,
    endsAt: window?.endsAt.toISOString() ?? null,
  };
}

export async function assertInterviewSlotInWindow(startsAt: Date) {
  const window = await getInterviewWindow();
  if (!window) {
    throw new InterviewWindowError(
      "not_configured",
      "Interview season is not configured.",
    );
  }
  const time = startsAt.getTime();
  if (
    time < window.startsAt.getTime() ||
    time > window.endsAt.getTime()
  ) {
    throw new InterviewWindowError(
      "invalid_range",
      "Interview slots must fall within the configured interview season.",
    );
  }
}

export async function upsertInterviewWindow(
  startsAt: Date,
  endsAt: Date,
  updatedByEmail?: string,
) {
  if (!(startsAt instanceof Date) || Number.isNaN(startsAt.getTime())) {
    throw new InterviewWindowError(
      "invalid_timestamp",
      "startsAt must be an ISO timestamp.",
    );
  }
  if (!(endsAt instanceof Date) || Number.isNaN(endsAt.getTime())) {
    throw new InterviewWindowError(
      "invalid_timestamp",
      "endsAt must be an ISO timestamp.",
    );
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new InterviewWindowError(
      "invalid_range",
      "Interview season end must be after the start.",
    );
  }

  let updatedBy: string | null = null;
  if (updatedByEmail) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, updatedByEmail.trim().toLowerCase()))
      .limit(1);
    updatedBy = user?.id ?? null;
  }

  await db
    .insert(interviewWindows)
    .values({
      singleton: 1,
      startsAt,
      endsAt,
      updatedBy,
    })
    .onConflictDoUpdate({
      target: interviewWindows.singleton,
      set: {
        startsAt,
        endsAt,
        updatedBy,
      },
    });

  return getInterviewWindowPayload();
}
