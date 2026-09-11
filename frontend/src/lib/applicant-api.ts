import { ApiError } from "./api-client"
import {
  readApiErrorMessage,
  userFacingApiError,
} from "./api-error-message"

export type ApplicantChoice = {
  preferenceRank: 1 | 2
  positionId: string
  title: string
  committeeId: string
  committee: string
}

export type ApplicantDocument = {
  documentType: "resume" | "transcript" | "registration"
  fileName: string
}

export type ApplicantApplication = {
  applicationCode: string
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
  choices: ApplicantChoice[]
  documents: ApplicantDocument[]
  canEdit: boolean
  editDeadline: string | null
  lockReason: string | null
}

export type ApplicantInterviewSlot = {
  id: string
  startsAt: string
  endsAt: string
}

export type ApplicantInterviewSlotTime = {
  startsAt: string
  endsAt: string
}

export type ApplicantInterviewSchedule = {
  committee: { id: string; name: string }
  canSchedule: boolean
  lockReason: string | null
  booking: {
    id: string
    slotId: string
    startsAt: string
    endsAt: string
    bookedAt: string
  } | null
  slots: ApplicantInterviewSlot[]
  booked: ApplicantInterviewSlotTime[]
}

async function applicantFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  if (response.status === 204) return undefined as T

  if (!response.ok) {
    const serverMessage = await readApiErrorMessage(response)
    throw new ApiError(
      response.status,
      userFacingApiError(
        response.status,
        serverMessage,
        "Could not reach your application. Try signing in again."
      )
    )
  }

  return response.json() as Promise<T>
}

export function getApplicantApplication() {
  return applicantFetch<ApplicantApplication>("/applicant/application")
}

export function updateApplicantChoices(body: {
  choices: { positionId: string; preferenceRank: 1 | 2 }[]
  slotId?: string
  portfolioUrl?: string
  githubUrl?: string
}) {
  return applicantFetch<ApplicantApplication>("/applicant/application", {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function updateApplicantDocuments(body: {
  documents: {
    documentType: ApplicantDocument["documentType"]
    fileName: string
    s3Key: string
  }[]
}) {
  return applicantFetch<ApplicantApplication>("/applicant/application", {
    method: "PATCH",
    body: JSON.stringify(body),
  })
}

export function getApplicantInterviewSlots(positionId?: string) {
  const query = positionId
    ? `?positionId=${encodeURIComponent(positionId)}`
    : ""
  return applicantFetch<ApplicantInterviewSchedule>(
    `/applicant/interview-slots${query}`
  )
}

export function putApplicantInterviewBooking(slotId: string) {
  return applicantFetch<{
    booking: {
      id: string
      slotId: string
      committeeId: string
      committeeName: string
      startsAt: string
      endsAt: string
      bookedAt: string
      rescheduled: boolean
    }
  }>("/applicant/interview-booking", {
    method: "PUT",
    body: JSON.stringify({ slotId }),
  })
}

export async function logoutApplicant() {
  try {
    await applicantFetch<void>("/applicant-auth/logout", { method: "POST" })
  } catch {
    // Still leave the dashboard even if logout fails.
  }
}
