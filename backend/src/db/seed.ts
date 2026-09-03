import { eq, inArray } from "drizzle-orm";
import { db } from "./index";
import {
  applicants,
  applicationChoices,
  applications,
  committees,
  positions,
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
    { firstName: "Ana", lastName: "Cruz", email: "ana.cruz@example.com", age: 20, section: "BSCS-3A" },
    { firstName: "Ben", lastName: "Santos", email: "ben.santos@example.com", age: 21, section: "BSIT-3B" },
    { firstName: "Carla", lastName: "Mendoza", email: "carla.mendoza@example.com", age: 19, section: "BSCS-2A" },
    { firstName: "Dario", lastName: "Aquino", email: "dario.aquino@example.com", age: 22, section: "BSIT-4A" },
  ];

  const existingApplicants = await db.select().from(applicants);
  const existingEmails = new Set(existingApplicants.map((a) => a.email));
  const newApplicantSeeds = applicantSeeds.filter((a) => !existingEmails.has(a.email));
  if (newApplicantSeeds.length > 0) {
    await db.insert(applicants).values(newApplicantSeeds);
  }

  const applicantRows = await db.select().from(applicants);
  const applicantIdByEmail = new Map(applicantRows.map((a) => [a.email, a.id]));

  const applicationSeeds = [
    {
      email: "ana.cruz@example.com",
      status: "pending" as const,
      choices: ["Executive Assistant to the CEO", "Finance Committee Staff"],
      motivation:
        "I want to support organization-wide initiatives and learn how executive and finance teams keep projects running.",
    },
    {
      email: "ben.santos@example.com",
      status: "approved" as const,
      choices: ["Development Committee Staff", "Technicals Committee Staff"],
      motivation:
        "I want to improve my technical skills and help build and operate the organization's digital tools.",
    },
    {
      email: "carla.mendoza@example.com",
      status: "rejected" as const,
      choices: ["Publicity Committee Staff", "Media Committee Staff"],
      motivation:
        "I like turning events into posters and recaps people actually want to share.",
    },
    {
      email: "dario.aquino@example.com",
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
    const choices = seed.choices.map((positionName, i) => ({
      positionId: positionIdByName.get(positionName)!,
      preferenceRank: i + 1,
    }));

    if (existing) {
      await db
        .update(applications)
        .set({ motivation: seed.motivation })
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
      .values({ applicantId, status: seed.status, motivation: seed.motivation })
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
