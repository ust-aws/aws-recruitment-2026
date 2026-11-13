import { readFileSync } from "node:fs";
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { applicants, applications } from "./schema";
import { generateApplicationCode, recruitmentYearInt } from "../lib/applications/application-code";
import { formatLastName, formatPersonName } from "../lib/apply/field-validation";
import { ageOn } from "../lib/applicant/age";
import { isApplicantGender, type ApplicantGender } from "../lib/applicant/gender";

// Adds general members from a local file, so their personal details never go in git.
//   MEMBERS_FILE=path.json   defaults to backend/members.local.json (git-ignored)
// Each entry: { firstName, lastName, email, birthday: "YYYY-MM-DD", gender, section,
//               studentNumber, contactNumber, facebookUrl }
// Age is worked out from the birthday. Safe to run again: existing people are updated.
type MemberSeed = {
  firstName: string;
  lastName: string;
  email: string;
  birthday: string;
  gender: string;
  section: string;
  studentNumber: string;
  contactNumber: string;
  facebookUrl: string;
};

function parse(entry: MemberSeed): MemberSeed & { gender: ApplicantGender } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.birthday)) throw new Error(`${entry.email}: birthday must be YYYY-MM-DD.`);
  if (!isApplicantGender(entry.gender)) throw new Error(`${entry.email}: gender must be male or female.`);
  return { ...entry, gender: entry.gender, email: entry.email.trim().toLowerCase() };
}

async function main() {
  const file = process.env.MEMBERS_FILE ?? new URL("../../members.local.json", import.meta.url);
  const entries = (JSON.parse(readFileSync(file, "utf8")) as MemberSeed[]).map(parse);
  const year = recruitmentYearInt();

  for (const entry of entries) {
    const person = {
      firstName: formatPersonName(entry.firstName),
      lastName: formatLastName(entry.lastName),
      birthday: entry.birthday,
      age: ageOn(entry.birthday, new Date()),
      gender: entry.gender,
      section: entry.section,
      studentNumber: entry.studentNumber,
      contactNumber: entry.contactNumber,
      facebookUrl: entry.facebookUrl,
    };
    const [existing] = await db.select({ id: applicants.id }).from(applicants).where(eq(applicants.email, entry.email));
    const applicantId = existing
      ? (await db.update(applicants).set(person).where(eq(applicants.id, existing.id)).returning({ id: applicants.id }))[0].id
      : (await db.insert(applicants).values({ ...person, email: entry.email }).returning({ id: applicants.id }))[0].id;

    // An accepted member-only application, so they sit in the payment flow like any general member.
    const [application] = await db
      .select({ id: applications.id })
      .from(applications)
      .where(and(eq(applications.applicantId, applicantId), eq(applications.recruitmentYear, year)));
    if (!application) {
      await db.insert(applications).values({
        applicantId,
        applicationCode: generateApplicationCode(year),
        recruitmentYear: year,
        applicationType: "member",
        status: "approved",
      });
    }
    console.log(`${existing ? "Updated" : "Added"} ${person.firstName} ${person.lastName} (${entry.email}), age ${person.age}${application ? ", application already existed" : ""}`);
  }
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
