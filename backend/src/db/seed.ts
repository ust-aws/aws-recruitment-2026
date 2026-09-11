import { eq, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  applicants,
  applicationChoices,
  applications,
  committees,
  positions,
  recruitmentWindows,
  interviewWindows,
  users,
} from "./schema";
import { POSITION_SEEDS } from "./position-seeds";

// Dev password for both seeded users is "password123" — local/dev only.
const DEV_PASSWORD_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8yTaSGE3Va8p8V6b8Vqjc.gBFm9UhK";
const LEGACY_POSITION_NAMES = [
  "Web Developer",
  "Cloud Engineer",
  "Graphic Designer",
  "Video Editor",
  "Documentation Officer",
  "Scheduling Coordinator",
];

async function main() {
  await db
    .insert(users)
    .values([
      {
        email: "hr@aws-ust.org",
        passwordHash: DEV_PASSWORD_HASH,
        firstName: "Hazel",
        lastName: "Reyes",
        role: "hr",
      },
      {
        email: "admin@aws-ust.org",
        passwordHash: DEV_PASSWORD_HASH,
        firstName: "Marco",
        lastName: "Villanueva",
        role: "admin",
      },
    ])
    .onConflictDoNothing({ target: users.email });

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  await db
    .insert(recruitmentWindows)
    .values({ singleton: 1, startsAt, endsAt })
    .onConflictDoUpdate({
      target: recruitmentWindows.singleton,
      set: { startsAt, endsAt },
    });

  const interviewStartsAt = new Date(startsAt);
  interviewStartsAt.setMonth(interviewStartsAt.getMonth() + 1);
  const interviewEndsAt = new Date(interviewStartsAt.getTime() + 45 * 24 * 60 * 60 * 1000);
  await db
    .insert(interviewWindows)
    .values({
      singleton: 1,
      startsAt: interviewStartsAt,
      endsAt: interviewEndsAt,
    })
    .onConflictDoUpdate({
      target: interviewWindows.singleton,
      set: { startsAt: interviewStartsAt, endsAt: interviewEndsAt },
    });

  const [seedReviewer] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "hr@aws-ust.org"))
    .limit(1);

  const committeeSeeds = new Map(
    POSITION_SEEDS.map((positionSeed) => [
      positionSeed.committee,
      {
        name: positionSeed.committee,
        description: positionSeed.committeeDescription,
      },
    ]),
  );

  for (const committeeSeed of committeeSeeds.values()) {
    await db
      .insert(committees)
      .values(committeeSeed)
      .onConflictDoUpdate({
        target: committees.name,
        set: { description: committeeSeed.description },
      });
  }

  const committeeRows = await db.select().from(committees);
  const committeeIdByName = new Map(committeeRows.map((c) => [c.name, c.id]));

  await db
    .update(positions)
    .set({ isOpen: false })
    .where(inArray(positions.name, LEGACY_POSITION_NAMES));

  for (const positionSeed of POSITION_SEEDS) {
    const values = {
      committeeId: committeeIdByName.get(positionSeed.committee)!,
      name: positionSeed.name,
      office: positionSeed.office,
      description: positionSeed.description,
      responsibilities: positionSeed.responsibilities.join("\n"),
      isOpen: positionSeed.isOpen,
    };

    await db
      .insert(positions)
      .values(values)
      .onConflictDoUpdate({
        target: [positions.committeeId, positions.name],
        set: {
          office: values.office,
          description: values.description,
          responsibilities: values.responsibilities,
          isOpen: values.isOpen,
        },
      });
  }

  const positionRows = await db.select().from(positions);
  const positionIdByName = new Map(positionRows.map((p) => [p.name, p.id]));

  const applicantSeeds = [
    {
      firstName: "Ana",
      lastName: "Cruz",
      email: "ana.cruz@example.com",
      age: 20,
      birthday: "2006-03-14",
      gender: "female" as const,
      section: "3CSC",
      studentNumber: "2023001001",
      contactNumber: "+639171000001",
      facebookUrl: "https://facebook.com/ana.cruz",
    },
    {
      firstName: "Ben",
      lastName: "Santos",
      email: "ben.santos@example.com",
      age: 21,
      birthday: "2005-07-22",
      gender: "male" as const,
      section: "3ITB",
      studentNumber: "2023001002",
      contactNumber: "+639171000002",
      facebookUrl: "https://facebook.com/ben.santos",
    },
    {
      firstName: "Carla",
      lastName: "Mendoza",
      email: "carla.mendoza@example.com",
      age: 19,
      birthday: "2007-01-08",
      gender: "female" as const,
      section: "2CSC",
      studentNumber: "2024001003",
      contactNumber: "+639171000003",
      facebookUrl: "https://facebook.com/carla.mendoza",
    },
    {
      firstName: "Dario",
      lastName: "Aquino",
      email: "dario.aquino@example.com",
      age: 22,
      birthday: "2004-11-30",
      gender: "male" as const,
      section: "4ITA",
      studentNumber: "2022001004",
      contactNumber: "+639171000004",
      facebookUrl: "https://facebook.com/dario.aquino",
    },
  ];

  const existingApplicants = await db.select().from(applicants);
  const existingEmails = new Set(existingApplicants.map((a) => a.email));
  const newApplicantSeeds = applicantSeeds.filter((a) => !existingEmails.has(a.email));
  if (newApplicantSeeds.length > 0) {
    await db.insert(applicants).values(newApplicantSeeds);
  }

  for (const seed of applicantSeeds) {
    await db
      .update(applicants)
      .set({
        birthday: seed.birthday,
        age: seed.age,
        gender: seed.gender,
        section: seed.section,
        studentNumber: seed.studentNumber,
        contactNumber: seed.contactNumber,
        facebookUrl: seed.facebookUrl,
      })
      .where(eq(applicants.email, seed.email));
  }

  const applicantRows = await db.select().from(applicants);
  const applicantIdByEmail = new Map(applicantRows.map((a) => [a.email, a.id]));

  const applicationSeeds = [
    {
      email: "ana.cruz@example.com",
      applicationCode: "AP-2026-742819",
      recruitmentYear: 2026,
      status: "pending" as const,
      choices: ["Executive Assistant to the CEO", "Finance Committee Staff"],
      motivation:
        "I want to support organization-wide initiatives and learn how executive and finance teams keep projects running.",
    },
    {
      email: "ben.santos@example.com",
      applicationCode: "AP-2026-183506",
      recruitmentYear: 2026,
      status: "approved" as const,
      choices: ["Development Committee Staff", "Technicals Committee Staff"],
      motivation:
        "I want to improve my technical skills and help build and operate the organization's digital tools.",
    },
    {
      email: "carla.mendoza@example.com",
      applicationCode: "AP-2026-905214",
      recruitmentYear: 2026,
      status: "rejected" as const,
      choices: ["Publicity Committee Staff", "Media Committee Staff"],
      motivation:
        "I like turning events into posters and recaps people actually want to share.",
    },
    {
      email: "dario.aquino@example.com",
      applicationCode: "AP-2026-460873",
      recruitmentYear: 2026,
      status: "pending" as const,
      choices: ["Human Resources Committee Staff", "Secretariat Committee Staff"],
      motivation:
        "I'm organized and I want to keep meetings, files, and calendars from falling apart.",
    },
  ];

  const existingApplications = await db.select().from(applications);
  const applicationByApplicantId = new Map(
    existingApplications.map((a) => [a.applicantId, a]),
  );

  for (const seed of applicationSeeds) {
    const applicantId = applicantIdByEmail.get(seed.email)!;
    const existing = applicationByApplicantId.get(applicantId);
    const decisionStatuses =
      seed.status === "approved"
        ? (["approved", "rejected"] as const)
        : seed.status === "rejected"
          ? (["rejected", "rejected"] as const)
          : (["pending", "pending"] as const);
    const decidedAt = seed.status === "pending" ? null : new Date("2026-08-26T00:00:00.000Z");
    const choices = seed.choices.map((positionName, i) => ({
      positionId: positionIdByName.get(positionName)!,
      preferenceRank: i + 1,
      decisionStatus: decisionStatuses[i],
      decidedBy: decidedAt ? seedReviewer.id : null,
      decidedAt,
    }));
    const finalPositionId = seed.status === "approved" ? choices[0].positionId : null;

    if (existing) {
      await db
        .update(applications)
        .set({
          applicationCode: seed.applicationCode,
          recruitmentYear: seed.recruitmentYear,
          status: seed.status,
          motivation: seed.motivation,
          finalPositionId,
        })
        .where(eq(applications.id, existing.id));

      await db
        .delete(applicationChoices)
        .where(eq(applicationChoices.applicationId, existing.id));
      await db.insert(applicationChoices).values(
        choices.map((choice) => ({
          ...choice,
          applicationId: existing.id,
        })),
      );
      continue;
    }

    const [application] = await db
      .insert(applications)
      .values({
        applicantId,
        applicationCode: seed.applicationCode,
        recruitmentYear: seed.recruitmentYear,
        status: seed.status,
        motivation: seed.motivation,
        finalPositionId,
      })
      .returning();

    await db.insert(applicationChoices).values(
      choices.map((choice) => ({
        ...choice,
        applicationId: application.id,
      })),
    );
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
