import { eq } from "drizzle-orm";
import { db } from "./index";
import { applicants } from "./schema";
import { formatLastName, formatPersonName } from "../lib/apply/field-validation";

// Capitalizes the first letter of every word in stored applicant names.
// Lists the changes and writes nothing unless FORMAT_NAMES_APPLY=true.
const apply = process.env.FORMAT_NAMES_APPLY === "true";

async function main() {
  const rows = await db
    .select({ id: applicants.id, firstName: applicants.firstName, lastName: applicants.lastName })
    .from(applicants);
  const changes = rows.flatMap((row) => {
    const firstName = formatPersonName(row.firstName);
    const lastName = formatLastName(row.lastName);
    return firstName === row.firstName && lastName === row.lastName
      ? []
      : [{ id: row.id, from: `${row.firstName} ${row.lastName}`, firstName, lastName }];
  });

  for (const change of changes) console.log(`${change.from}  ->  ${change.firstName} ${change.lastName}`);
  console.log(`${changes.length} of ${rows.length} names need formatting.`);
  if (!apply) {
    if (changes.length > 0) console.log("Nothing written. Rerun with FORMAT_NAMES_APPLY=true to apply.");
    return;
  }
  for (const change of changes) {
    await db
      .update(applicants)
      .set({ firstName: change.firstName, lastName: change.lastName })
      .where(eq(applicants.id, change.id));
  }
  console.log(`Updated ${changes.length} names.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
