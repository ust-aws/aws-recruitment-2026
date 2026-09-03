import type { Application, Position } from "./application-types"

// Leftover fixtures; Apply, HR, and the positions browser use the API.

export const POSITIONS: Position[] = [
  {
    id: "pos-web-dev",
    committee: "Technical Committee",
    title: "Web Developer",
    description: "Builds and maintains the recruitment website.",
  },
  {
    id: "pos-cloud",
    committee: "Technical Committee",
    title: "Cloud Engineer",
    description: "Manages AWS infrastructure for club projects.",
  },
  {
    id: "pos-exec-tech",
    committee: "Technical Committee",
    title: "Executive Associate",
    description: "Supports the technical committee directors.",
  },
  {
    id: "pos-graphic",
    committee: "Creatives Committee",
    title: "Graphic Designer",
    description: "Produces visual assets for events and campaigns.",
  },
  {
    id: "pos-video",
    committee: "Creatives Committee",
    title: "Video Editor",
    description: "Edits video content for events and promotions.",
  },
  {
    id: "pos-exec-creatives",
    committee: "Creatives Committee",
    title: "Executive Associate",
    description: "Supports the creatives committee directors.",
  },
  {
    id: "pos-docs",
    committee: "Secretariat Committee",
    title: "Documentation Officer",
    description: "Maintains meeting minutes and internal records.",
  },
  {
    id: "pos-sched",
    committee: "Secretariat Committee",
    title: "Scheduling Coordinator",
    description: "Coordinates event and meeting schedules.",
  },
  {
    id: "pos-exec-secretariat",
    committee: "Secretariat Committee",
    title: "Executive Associate",
    description: "Supports the secretariat committee directors.",
  },
  {
    id: "pos-treasurer",
    committee: "Finance Committee",
    title: "Treasurer",
    description: "Tracks budgets and reimbursements.",
  },
  {
    id: "pos-exec-finance",
    committee: "Finance Committee",
    title: "Executive Associate",
    description: "Supports the finance committee directors.",
  },
]

export const COMMITTEES = [
  ...new Set(POSITIONS.map((position) => position.committee)),
]

const lorem =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."

export const SEED_APPLICATIONS: Application[] = [
  {
    id: "app-lyka",
    status: "pending",
    submittedAt: "2026-08-25T00:00:00.000Z",
    firstName: "Lyka Nicole",
    lastName: "Escosia",
    email: "lykanicole.escosia.cics@ust.edu.ph",
    age: 21,
    section: "3ISB",
    motivation: lorem,
    choices: [
      {
        preferenceRank: 1,
        positionId: "pos-exec-creatives",
        committee: "Creatives Committee",
        title: "Executive Associate",
      },
      {
        preferenceRank: 2,
        positionId: "pos-exec-secretariat",
        committee: "Secretariat Committee",
        title: "Executive Associate",
      },
    ],
    documents: [
      { documentType: "resume", fileName: "Escosia_Resume", s3Key: "mock/Escosia_Resume.pdf" },
      { documentType: "transcript", fileName: "Escosia_TRS", s3Key: "mock/Escosia_TRS.pdf" },
    ],
  },
  {
    id: "app-carl",
    status: "rejected",
    submittedAt: "2026-08-24T00:00:00.000Z",
    firstName: "Carl Raymond",
    lastName: "Casihan",
    email: "carlraymond.casihan.cscs@ust.edu.ph",
    age: 20,
    section: "3ISB",
    motivation: lorem,
    choices: [
      {
        preferenceRank: 1,
        positionId: "pos-graphic",
        committee: "Creatives Committee",
        title: "Graphic Designer",
      },
      {
        preferenceRank: 2,
        positionId: "pos-video",
        committee: "Creatives Committee",
        title: "Video Editor",
      },
    ],
    documents: [
      { documentType: "resume", fileName: "Casihan_Resume", s3Key: "mock/Casihan_Resume.pdf" },
      { documentType: "transcript", fileName: "Casihan_TRS", s3Key: "mock/Casihan_TRS.pdf" },
    ],
  },
  {
    id: "app-benedict",
    status: "approved",
    submittedAt: "2026-08-22T00:00:00.000Z",
    firstName: "Benedict",
    lastName: "Rosales",
    email: "benedict.rosales.cscs@ust.edu.ph",
    age: 21,
    section: "3CSA",
    motivation: lorem,
    choices: [
      {
        preferenceRank: 1,
        positionId: "pos-web-dev",
        committee: "Technical Committee",
        title: "Web Developer",
      },
      {
        preferenceRank: 2,
        positionId: "pos-cloud",
        committee: "Technical Committee",
        title: "Cloud Engineer",
      },
    ],
    documents: [
      { documentType: "resume", fileName: "Rosales_Resume", s3Key: "mock/Rosales_Resume.pdf" },
      { documentType: "transcript", fileName: "Rosales_TRS", s3Key: "mock/Rosales_TRS.pdf" },
    ],
  },
  {
    id: "app-halle",
    status: "pending",
    submittedAt: "2026-08-21T00:00:00.000Z",
    firstName: "Halle Clarice",
    lastName: "Grimaldo",
    email: "halleclarice.grimaldo.cscs@ust.edu.ph",
    age: 19,
    section: "2ISB",
    motivation: lorem,
    choices: [
      {
        preferenceRank: 1,
        positionId: "pos-treasurer",
        committee: "Finance Committee",
        title: "Treasurer",
      },
      {
        preferenceRank: 2,
        positionId: "pos-exec-finance",
        committee: "Finance Committee",
        title: "Executive Associate",
      },
    ],
    documents: [
      { documentType: "resume", fileName: "Grimaldo_Resume", s3Key: "mock/Grimaldo_Resume.pdf" },
      { documentType: "transcript", fileName: "Grimaldo_TRS", s3Key: "mock/Grimaldo_TRS.pdf" },
    ],
  },
]
