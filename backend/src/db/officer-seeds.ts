import {
  executiveOfficeCommittees,
  staffCommittees,
} from "../lib/apply/committee-office-groups";
import { formatLastName, formatPersonName } from "../lib/apply/field-validation";
import { lookupOfficerRecipient } from "../lib/email/officer-recipients";

export type OfficerSeedKind = "eb" | "director" | "adviser";

export type OfficerSeed = {
  kind: OfficerSeedKind;
  /** The office or committee name, or `adviser-<n>`. Unique per recruitment year. */
  seatKey: string;
  committee: string | null;
  title: string;
  firstName: string;
  lastName: string;
  /** Null when we do not have the person's email yet (advisers). */
  email: string | null;
  sortOrder: number;
};

/** Same names and titles as the public people list (`frontend/src/lib/people`). */
const EB_BY_OFFICE_ORDER: { name: string; title: string }[] = [
  { name: "Sydney Alison Padua", title: "Chief Executive Officer" },
  { name: "Marc Ellis Axalan", title: "Chief Operating Officer" },
  { name: "Alden Alexander Olmedo", title: "Chief Relations Officer" },
  { name: "Hannah Muñoz", title: "Corporate Secretary" },
  { name: "Neil Alfonz Casas", title: "Chief Technology Officer" },
  { name: "Kyan Charles So", title: "Chief Finance Officer" },
  { name: "Claire Antonette Abas", title: "Chief Human Resource Officer" },
  { name: "Lyka Nicole Escosia", title: "Chief Creative Officer" },
];

/** In `staffCommittees()` order, one director per committee. */
const DIRECTOR_BY_COMMITTEE_ORDER: { name: string; title: string }[] = [
  { name: "Jaren Maxene Ladia", title: "Logistics Committee Director" },
  { name: "Christian Gabriel Mariveles", title: "Community Development Committee Director" },
  { name: "Antonio Axellance III Paco", title: "Sponsorships Committee Director" },
  { name: "John Benedict Lopez", title: "Marketing Committee Director" },
  { name: "Nicole Alcantara", title: "External Affairs Committee Director" },
  { name: "Angeline Alby de Mesa", title: "Secretariat Committee Director" },
  { name: "Pete Andrei Lapuebla", title: "Technical Committee Director" },
  { name: "Juan Marcus Ferrer", title: "Development Committee Director" },
  { name: "Paulyn Gamban", title: "Finance Committee Director" },
  { name: "Lorraine Alexandra Tamondong", title: "Human Resources Committee Director" },
  { name: "Aldrhey Jave Agsunod", title: "Documentation Committee Director" },
  { name: "Allen Zander Estuista", title: "Media Committee Director" },
  { name: "Elleinrich Jarina", title: "Publication Committee Director" },
];

/** In Member ID order (9001 to 9003). Their emails are not on file, so they hold a placeholder until HR edits them. */
const ADVISERS: { seatKey: string; firstName: string; lastName: string; title: string }[] = [
  { seatKey: "adviser-tayuan", firstName: "Ronina", lastName: "Tayuan", title: "Adviser" },
  { seatKey: "adviser-domantay", firstName: "John Matthew", lastName: "Domantay", title: "Adviser" },
  { seatKey: "adviser-de-guzman", firstName: "Edwin", lastName: "De Guzman", title: "Adviser" },
];

/** The board seat titles in office order, for the officer hunt's seats. */
export function executiveSeatTitles(): string[] {
  return EB_BY_OFFICE_ORDER.map((person) => person.title);
}

/** The director seat titles in committee order, for the officer hunt's seats. */
export function directorSeatTitles(): string[] {
  return DIRECTOR_BY_COMMITTEE_ORDER.map((person) => person.title);
}

function seatFromPerson(
  kind: "eb" | "director",
  committee: string,
  person: { name: string; title: string },
  sortOrder: number,
): OfficerSeed {
  const recipient = lookupOfficerRecipient(committee);
  if (!recipient) throw new Error(`No officer email on file for ${committee}.`);
  const firstName = person.name.slice(0, person.name.length - recipient.lastName.length).trim();
  return {
    kind,
    seatKey: committee,
    committee,
    title: person.title,
    firstName: formatPersonName(firstName),
    lastName: formatLastName(recipient.lastName),
    email: recipient.email,
    sortOrder,
  };
}

/** Executive board, then directors, then advisers, in Member ID order. */
export function officerSeedList(): OfficerSeed[] {
  const offices = executiveOfficeCommittees();
  const committees = staffCommittees();
  if (
    offices.length !== EB_BY_OFFICE_ORDER.length ||
    committees.length !== DIRECTOR_BY_COMMITTEE_ORDER.length
  ) {
    throw new Error("Officer seeds no longer match the executive offices or committees.");
  }
  return [
    ...offices.map((office, index) => seatFromPerson("eb", office, EB_BY_OFFICE_ORDER[index], index)),
    ...committees.map((committee, index) =>
      seatFromPerson("director", committee, DIRECTOR_BY_COMMITTEE_ORDER[index], index),
    ),
    ...ADVISERS.map(
      (adviser, index): OfficerSeed => ({
        kind: "adviser",
        seatKey: adviser.seatKey,
        committee: null,
        title: adviser.title,
        firstName: formatPersonName(adviser.firstName),
        lastName: formatLastName(adviser.lastName),
        email: null,
        sortOrder: index,
      }),
    ),
  ];
}
