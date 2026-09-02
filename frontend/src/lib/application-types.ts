export type ApplicationStatus = "pending" | "approved" | "rejected"

export type DocumentType = "resume" | "transcript"

export type Position = {
  id: string
  committee: string
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
  status: ApplicationStatus
  submittedAt: string
  firstName: string
  lastName: string
  email: string
  age: number | null
  section: string | null
  motivation: string
  choices: ApplicationChoice[]
  documents: ApplicationDocument[]
}

export type CreateApplicationInput = {
  firstName: string
  lastName: string
  email: string
  age: number
  section: string
  motivation: string
  choices: { positionId: string; preferenceRank: 1 | 2 }[]
  documents: { documentType: DocumentType; fileName: string; s3Key: string }[]
}
