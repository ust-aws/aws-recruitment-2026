export type ApplicationStatus = "pending" | "approved" | "rejected"

export type DocumentType = "resume" | "transcript" | "registration"

export type Position = {
  id: string
  committee: string
  /** Present on API rows; omitted in legacy mock fixtures. */
  committee_id?: string
  title: string
  description: string
}

export type ApplicationChoice = {
  preferenceRank: 1 | 2
  positionId: string
  committee: string
  title: string
}

export type ApplicationDocument = {
  documentType: DocumentType
  fileName: string
  s3Key: string | null
}

export type Application = {
  id: string
  applicationCode: string
  status: ApplicationStatus
  submittedAt: string
  firstName: string
  lastName: string
  email: string
  age: number | null
  birthday: string | null
  gender: string | null
  section: string | null
  studentNumber?: string | null
  contactNumber?: string | null
  facebookUrl?: string | null
  motivation: string
  portfolioUrl?: string | null
  githubUrl?: string | null
  choices: ApplicationChoice[]
  documents: ApplicationDocument[]
}

export type CreateApplicationInput = {
  firstName: string
  lastName: string
  email: string
  age: number
  birthday: string
  gender: string
  section: string
  studentNumber: string
  contactNumber: string
  facebookUrl: string
  dataPrivacyAgreed: boolean
  motivation: string
  portfolioUrl?: string
  githubUrl?: string
  slotId: string
  choices: { positionId: string; preferenceRank: 1 | 2 }[]
  documents: { documentType: DocumentType; fileName: string; s3Key: string }[]
}
