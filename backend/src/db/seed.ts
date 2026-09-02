import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  applicants,
  applicationChoices,
  applications,
  committees,
  positions,
  users,
} from "./schema";

// Dev password for both seeded users is "password123" — local/dev only.
const DEV_PASSWORD_HASH =
  "$2b$10$CwTycUXWue0Thq9StjUM0uJ8yTaSGE3Va8p8V6b8Vqjc.gBFm9UhK";

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

  await db
    .insert(committees)
    .values([
      {
        name: "Technical Committee",
        description: "Builds and maintains AWS UST's software and infrastructure.",
      },
      {
        name: "Creatives Committee",
        description: "Handles design, branding, and multimedia content.",
      },
      {
        name: "Secretariat Committee",
        description: "Manages documentation, scheduling, and internal communications.",
      },
    ])
    .onConflictDoNothing({ target: committees.name });

  const committeeRows = await db.select().from(committees);
  const committeeIdByName = new Map(committeeRows.map((c) => [c.name, c.id]));

  const positionSeeds = [
    {
      committee: "Technical Committee",
      name: "Web Developer",
      description: "Builds and maintains the recruitment website.",
      responsibilities: "Implement features, fix bugs, review PRs.",
      isOpen: true,
    },
    {
      committee: "Technical Committee",
      name: "Cloud Engineer",
      description: "Manages AWS infrastructure for club projects.",
      responsibilities: "Provision resources, monitor costs, write IaC.",
      isOpen: true,
    },
    {
      committee: "Creatives Committee",
      name: "Graphic Designer",
      description: "Produces visual assets for events and campaigns.",
      responsibilities: "Design posters, social media graphics, brand assets.",
      isOpen: true,
    },
    {
      committee: "Creatives Committee",
      name: "Video Editor",
      description: "Edits video content for events and promotions.",
      responsibilities: "Cut footage, add captions, publish recaps.",
      isOpen: false,
    },
    {
      committee: "Secretariat Committee",
      name: "Documentation Officer",
      description: "Maintains meeting minutes and internal records.",
      responsibilities: "Take minutes, organize files, track action items.",
      isOpen: true,
    },
    {
      committee: "Secretariat Committee",
      name: "Scheduling Coordinator",
      description: "Coordinates event and meeting schedules.",
      responsibilities: "Book venues, send invites, manage calendars.",
      isOpen: true,
    },
  ];

  await db
    .insert(positions)
    .values(
      positionSeeds.map((p) => ({
        committeeId: committeeIdByName.get(p.committee)!,
        name: p.name,
        description: p.description,
        responsibilities: p.responsibilities,
        isOpen: p.isOpen,
      })),
    )
    .onConflictDoNothing();

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
      choices: ["Web Developer", "Cloud Engineer"],
      motivation:
        "I want to build real products with the technical committee and learn how AWS UST ships features.",
    },
    {
      email: "ben.santos@example.com",
      status: "approved" as const,
      choices: ["Cloud Engineer", "Web Developer"],
      motivation:
        "Cloud infrastructure is what I want to get better at, and this org is where I'd actually use it.",
    },
    {
      email: "carla.mendoza@example.com",
      status: "rejected" as const,
      choices: ["Graphic Designer", "Video Editor"],
      motivation:
        "I like turning events into posters and recaps people actually want to share.",
    },
    {
      email: "dario.aquino@example.com",
      status: "pending" as const,
      choices: ["Documentation Officer", "Scheduling Coordinator"],
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
    if (existing) {
      // Insert is skipped for existing apps; still fill motivation after the column lands.
      await db
        .update(applications)
        .set({ motivation: seed.motivation })
        .where(eq(applications.id, existing.id));
      continue;
    }

    const [application] = await db
      .insert(applications)
      .values({ applicantId, status: seed.status, motivation: seed.motivation })
      .returning();

    await db
      .insert(applicationChoices)
      .values(
        seed.choices.map((positionName, i) => ({
          applicationId: application.id,
          positionId: positionIdByName.get(positionName)!,
          preferenceRank: i + 1,
        })),
      )
      .onConflictDoNothing();
  }

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
