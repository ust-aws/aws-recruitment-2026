export const PERSON_AVATAR_PLACEHOLDER = "/people/person-placeholder.webp"

import { staffCommitteeSeedNamesInOrgOrder } from "@/lib/apply/committee-groups"

export type PersonTerm = {
  name: string
  title: string
  academicYear: string
  photo?: string
  /** CSS `object-position` for circular avatar crop (e.g. `50% 40%`). */
  photoObjectPosition?: string
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

export type AdviserSeat = {
  id: string
  rank: number
  current: PersonTerm
}

const CURRENT_AY = "AY 2026-2027"
const PREVIOUS_AY = "AY 2025-2026"

/** Photos in `public/people/current-ebs/` keyed by `OfficerSeat.id`. */
const CURRENT_EB_PHOTOS: Partial<Record<string, string>> = {
  ceo: "/people/current-ebs/CEO_Padua.webp",
  coo: "/people/current-ebs/COO_Axalan.webp",
  cro: "/people/current-ebs/CRO_Olmedo.webp",
  "corp-sec": "/people/current-ebs/SEC_Muñoz.webp",
  cto: "/people/current-ebs/CTO_Casas.webp",
  chro: "/people/current-ebs/CHRO_Abas.webp",
  cfo: "/people/current-ebs/CFO_So.webp",
  cco: "/people/current-ebs/CCO_Escosia.webp",
}

/** Outgoing EB photos in `public/people/previous-ebs/` keyed by `OfficerSeat.id`. */
const PREVIOUS_EB_PHOTOS: Partial<Record<string, string>> = {
  ceo: "/people/previous-ebs/CEO_Viray.webp",
  coo: "/people/previous-ebs/COO_Axalan.webp",
  cro: "/people/previous-ebs/CRO_Sigua.webp",
  "corp-sec": "/people/previous-ebs/Sec_Elleazar.webp",
  cfo: "/people/previous-ebs/CFO_Palanog.webp",
  chro: "/people/previous-ebs/CHRO_To.webp",
  cco: "/people/previous-ebs/CCO_Padua.webp",
}

/** Previous EB headshots that need a lower focal point in the avatar circle. */
const PREVIOUS_EB_PHOTO_OBJECT_POSITION: Partial<Record<string, string>> = {
  ceo: "50% 30%",
  cro: "50% 28%",
  "corp-sec": "50% 26%",
  cfo: "50% 28%",
  chro: "50% 26%",
}

/** Committee director photos in `public/people/directors/` keyed by seeded committee name. */
const DIRECTOR_PHOTOS_BY_COMMITTEE: Partial<Record<string, string>> = {
  "Logistics Committee": "/people/directors/Logistics_Ladia.webp",
  "Community Development Committee":
    "/people/directors/ComDev_Mariveles.webp",
  "Sponsorship Committee": "/people/directors/Sponsorships_Paco.webp",
  "Marketing Committee": "/people/directors/Marketing_Lopez.webp",
  "External Affairs Committee": "/people/directors/Externals_Alcantara.webp",
  "Secretariat Committee": "/people/directors/Secretary_de%20Mesa.webp",
  "Technicals Committee": "/people/directors/Technicals_Lapuebla.webp",
  "Development Committee": "/people/directors/Development_Ferrer.webp",
  "Finance Committee": "/people/directors/Finance_Gamban.webp",
  "Human Resources Committee": "/people/directors/HR_Tamondong.webp",
  "Documentation Committee": "/people/directors/Documentation_Agsunod.webp",
  "Media Committee": "/people/directors/Media_Estuista.webp",
  "Publicity Committee": "/people/directors/Publicity_Jarina.webp",
}

const DIRECTOR_PHOTO_OBJECT_POSITION: Partial<Record<string, string>> = {
  "Human Resources Committee": "50% 50%",
  "Media Committee": "28% 50%",
}

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
    current: {
      name,
      title,
      academicYear: CURRENT_AY,
      photo: CURRENT_EB_PHOTOS[id],
    },
    previous: {
      name: previousName,
      title,
      academicYear: PREVIOUS_AY,
      photo: PREVIOUS_EB_PHOTOS[id],
      photoObjectPosition: PREVIOUS_EB_PHOTO_OBJECT_POSITION[id],
    },
  }
}

export const EXECUTIVE_BOARD: OfficerSeat[] = [
  officer(1, "ceo", "Sydney Alison Padua", "Chief Executive Officer", "Josh Kenn Viray"),
  officer(2, "coo", "Marc Ellis Axalan", "Chief Operating Officer", "Marc Axalan"),
  officer(
    3,
    "cro",
    "Alden Alexander Olmedo",
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
  officer(5, "cto", "Neil Alfonz Casas", "Chief Technology Officer", "Lance Owen Gulinao"),
  officer(6, "cfo", "Kyan Charles So", "Chief Finance Officer", "Alexa Palanog"),
  officer(7, "chro", "Claire Antonette Abas", "Chief Human Resource Officer", "Denzel To"),
  officer(
    8,
    "cco",
    "Lyka Nicole Escosia",
    "Chief Creative Officer",
    "Sydney Padua",
  ),
].sort((a, b) => a.rank - b.rank)

const COMMITTEE_DIRECTOR_BY_COMMITTEE: Record<
  string,
  { title: string; name: string }
> = {
  "Logistics Committee": {
    title: "Logistics Committee Director",
    name: "Jaren Maxene Ladia",
  },
  "Community Development Committee": {
    title: "Community Development Committee Director",
    name: "Christian Gabriel Mariveles",
  },
  "Sponsorship Committee": {
    title: "Sponsorships Committee Director",
    name: "Antonio Axellance III Paco",
  },
  "Marketing Committee": {
    title: "Marketing Committee Director",
    name: "John Benedict Lopez",
  },
  "External Affairs Committee": {
    title: "External Affairs Committee Director",
    name: "Nicole Alcantara",
  },
  "Secretariat Committee": {
    title: "Secretariat Committee Director",
    name: "Angeline Alby de Mesa",
  },
  "Technicals Committee": {
    title: "Technical Committee Director",
    name: "Pete Andrei Lapuebla",
  },
  "Development Committee": {
    title: "Development Committee Director",
    name: "Juan Marcus Ferrer",
  },
  "Finance Committee": {
    title: "Finance Committee Director",
    name: "Paulyn Gamban",
  },
  "Human Resources Committee": {
    title: "Human Resources Committee Director",
    name: "Lorraine Alexandra Tamondong",
  },
  "Documentation Committee": {
    title: "Documentation Committee Director",
    name: "Aldrhey Jave Agsunod",
  },
  "Media Committee": {
    title: "Media Committee Director",
    name: "Allen Zander Estuista",
  },
  "Publicity Committee": {
    title: "Publication Committee Director",
    name: "Elleinrich Jarina",
  },
}

/** Adviser photos in `public/advisers/`. */
export const ADVISERS: AdviserSeat[] = [
  {
    id: "adviser-tayuan",
    rank: 1,
    current: {
      name: "Ronina Tayuan",
      title: "Asst. Prof., MSCS",
      academicYear: CURRENT_AY,
      photo: "/advisers/Adviser_Tayuan.webp",
    },
  },
  {
    id: "adviser-domantay",
    rank: 2,
    current: {
      name: "John Matthew Domantay",
      title: "Technical Adviser",
      academicYear: CURRENT_AY,
      photo: "/advisers/Adviser_Domantay.webp",
    },
  },
  {
    id: "adviser-de-guzman",
    rank: 3,
    current: {
      name: "Edwin De Guzman",
      title: "Asst. Prof., MCP, DIT",
      academicYear: CURRENT_AY,
      photo: "/advisers/Adviser_De%20Guzman.webp",
    },
  },
].sort((a, b) => a.rank - b.rank)

export const COMMITTEE_DIRECTORS: DirectorSeat[] =
  staffCommitteeSeedNamesInOrgOrder().map((committee, index) => {
    const seat = COMMITTEE_DIRECTOR_BY_COMMITTEE[committee]
    if (!seat) {
      throw new Error(`Missing committee director for "${committee}"`)
    }
    return {
      id: `director-${index + 1}`,
      rank: index + 1,
      current: {
        name: seat.name,
        title: seat.title,
        academicYear: CURRENT_AY,
        photo: DIRECTOR_PHOTOS_BY_COMMITTEE[committee],
        photoObjectPosition: DIRECTOR_PHOTO_OBJECT_POSITION[committee],
      },
    }
  })
