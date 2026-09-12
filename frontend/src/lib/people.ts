export const PERSON_AVATAR_PLACEHOLDER = "/people/person-placeholder.png"

export type PersonTerm = {
  name: string
  title: string
  academicYear: string
  photo?: string
}

export type OfficerSeat = {
  id: string
  rank: number
  current: PersonTerm
  previous: PersonTerm
}

export type DirectorSeat = {
  id: string
  rank: number
  current: PersonTerm
}

const CURRENT_AY = "AY 2026-2027"
const PREVIOUS_AY = "AY 2025-2026"

/** Matches office order in `committee-groups.ts` (CEO → COO → CRO → …). */
function officer(
  rank: number,
  id: string,
  name: string,
  title: string,
  previousName: string,
): OfficerSeat {
  return {
    id,
    rank,
    current: { name, title, academicYear: CURRENT_AY },
    previous: {
      name: previousName,
      title,
      academicYear: PREVIOUS_AY,
    },
  }
}

export const EXECUTIVE_BOARD: OfficerSeat[] = [
  officer(1, "ceo", "Sydney Padua", "Chief Executive Officer", "Josh Kenn Viray"),
  officer(2, "coo", "Marc Axalan", "Chief Operating Officer", "Marc Axalan"),
  officer(
    3,
    "cro",
    "Alden Olmedo",
    "Chief Relations Officer",
    "Leigh Andrei Sigua",
  ),
  officer(
    4,
    "corp-sec",
    "Hannah Muñoz",
    "Corporate Secretary",
    "Jan Vincent Elleazar",
  ),
  officer(5, "cto", "Neil Casas", "Chief Technology Officer", "Lance Owen Gulinao"),
  officer(6, "cfo", "Kyan So", "Chief Finance Officer", "Alexa Palanog"),
  officer(7, "chro", "Claire Abas", "Chief Human Resource Officer", "Denzel To"),
  officer(
    8,
    "cco",
    "Lyka Escosia",
    "Chief Creative Officer",
    "Sydney Padua",
  ),
].sort((a, b) => a.rank - b.rank)

const COMMITTEE_DIRECTOR_SEATS: Array<{ rank: number; title: string; name: string }> = [
  { rank: 1, title: "Sponsorships Committee Director", name: "Antionio Axellance III Paco" },
  { rank: 2, title: "Marketing Committee Director", name: "John Benedict Lopez" },
  { rank: 3, title: "External Affairs Committee Director", name: "Nicole Alcantara" },
  { rank: 4, title: "Logistics Committee Director", name: "Jaren Maxene Ladia" },
  { rank: 5, title: "Secretariat Committee Director", name: "Angeline Alby de Mesa" },
  { rank: 6, title: "Finance Committee Director", name: "Paulyn Gamban" },
  { rank: 7, title: "Community Development Committee Director", name: "Christian Gabriel Mariveles" },
  { rank: 8, title: "Human Resources Committee Director", name: "Lorraine Alexandra Tamondong" },
  { rank: 9, title: "Technical Committee Director", name: "Pete Andrei Lapuebla" },
  { rank: 10, title: "Development Committee Director", name: "Juan Marcus Ferrer" },
  { rank: 11, title: "Documentation Committee Director", name: "Aldrhey Jave Agsunod" },
  { rank: 12, title: "Media Committee Director", name: "Zander Belen Estuista" },
  { rank: 13, title: "Publication Committee Director", name: "Elleinrich Jarina" },
]

export const COMMITTEE_DIRECTORS: DirectorSeat[] = COMMITTEE_DIRECTOR_SEATS
  .sort((a, b) => a.rank - b.rank)
  .map((seat, index) => ({
    id: `director-${index + 1}`,
    rank: seat.rank,
    current: {
      name: seat.name,
      title: seat.title,
      academicYear: CURRENT_AY,
    },
  }))
