import { eq } from "drizzle-orm";
import { db } from "../../db";
import { recruitmentWindows, users } from "../../db/schema";

export type RecruitmentWindow = {
  startsAt: Date;
  endsAt: Date;
};

export type RecruitmentSeasonCode =
  | "not_configured"
  | "recruitment_not_started"
  | "deadline_passed";

export type RecruitmentSeasonStatus = {
  open: boolean;
  code: RecruitmentSeasonCode | null;
  message: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export type RecruitmentWindowPayload = RecruitmentSeasonStatus;

export function getRecruitmentSeasonStatus(
  window: RecruitmentWindow | null,
  now = new Date(),
): RecruitmentSeasonStatus {
  const startsAt = window?.startsAt.toISOString() ?? null;
  const endsAt = window?.endsAt.toISOString() ?? null;
  if (!window) {
    return {
      open: false,
      code: "not_configured",
      message: "Applications are not open yet.",
      startsAt,
      endsAt,
    };
  }
  if (now.getTime() < window.startsAt.getTime()) {
    return {
      open: false,
      code: "recruitment_not_started",
      message: "Recruitment has not started.",
      startsAt,
      endsAt,
    };
  }
  if (now.getTime() >= window.endsAt.getTime()) {
    return {
      open: false,
      code: "deadline_passed",
      message: "Recruitment week has ended. New applications are closed.",
      startsAt,
      endsAt,
    };
  }
  return {
    open: true,
    code: null,
    message: null,
    startsAt,
    endsAt,
  };
}

export async function resolveRecruitmentSeasonStatus(
  options: {
    database?: RecruitmentWindowDatabase;
    now?: Date;
  } = {},
): Promise<RecruitmentSeasonStatus> {
  return getRecruitmentSeasonStatus(
    await getRecruitmentWindow(options.database),
    options.now,
  );
}

type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type RecruitmentWindowDatabase = typeof db | DbTransaction;

export class RecruitmentWindowError extends Error {
  constructor(
    public readonly code: "invalid_range" | "invalid_timestamp",
    message: string,
  ) {
    super(message);
    this.name = "RecruitmentWindowError";
  }
}

export async function getRecruitmentWindow(
  database: RecruitmentWindowDatabase = db,
): Promise<RecruitmentWindow | null> {
  const [row] = await database
    .select({
      startsAt: recruitmentWindows.startsAt,
      endsAt: recruitmentWindows.endsAt,
    })
    .from(recruitmentWindows)
    .where(eq(recruitmentWindows.singleton, 1))
    .limit(1);

  return row ?? null;
}

export async function getRecruitmentWindowPayload(): Promise<RecruitmentWindowPayload> {
  return resolveRecruitmentSeasonStatus();
}

export async function upsertRecruitmentWindow(
  startsAt: Date,
  endsAt: Date,
  updatedByEmail?: string,
) {
  if (!(startsAt instanceof Date) || Number.isNaN(startsAt.getTime())) {
    throw new RecruitmentWindowError(
      "invalid_timestamp",
      "startsAt must be an ISO timestamp.",
    );
  }
  if (!(endsAt instanceof Date) || Number.isNaN(endsAt.getTime())) {
    throw new RecruitmentWindowError(
      "invalid_timestamp",
      "endsAt must be an ISO timestamp.",
    );
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    throw new RecruitmentWindowError(
      "invalid_range",
      "Recruitment end must be after the start.",
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
    .insert(recruitmentWindows)
    .values({
      singleton: 1,
      startsAt,
      endsAt,
      updatedBy,
    })
    .onConflictDoUpdate({
      target: recruitmentWindows.singleton,
      set: {
        startsAt,
        endsAt,
        updatedBy,
      },
    });

  return getRecruitmentWindowPayload();
}
