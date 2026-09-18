export type ApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
export type ApplicationType = "position" | "member"

export type DocumentType = "resume" | "registration"

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
  fileSizeBytes: number
  uploadedAt: string
  availableUntil: string
}

export type Application = {
  id: string
  applicationCode: string
  status: ApplicationStatus
  applicationType: ApplicationType
  memberId: string | null
  submittedAt: string
  firstName: string
  lastName: string
  email: string
  age: number | null
  birthday: string | null
  gender: string | null
  section: string | null
  studentNumber: string | null
  contactNumber: string | null
  facebookUrl: string | null
  motivation: string
  portfolioUrl: string | null
  githubUrl: string | null
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
  applicationType: ApplicationType
  portfolioUrl?: string
  githubUrl?: string
  slotId?: string
  choices: { positionId: string; preferenceRank: 1 | 2 }[]
  uploadSessionId: string
}
