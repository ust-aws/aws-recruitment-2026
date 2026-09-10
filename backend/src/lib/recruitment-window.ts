import { eq } from "drizzle-orm";
import { db } from "../db";
import { recruitmentWindows, users } from "../db/schema";

export type RecruitmentWindow = {
  startsAt: Date;
  endsAt: Date;
};

export type RecruitmentWindowPayload = {
  startsAt: string | null;
  endsAt: string | null;
};

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
  const window = await getRecruitmentWindow();
  return {
    startsAt: window?.startsAt.toISOString() ?? null,
    endsAt: window?.endsAt.toISOString() ?? null,
  };
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
