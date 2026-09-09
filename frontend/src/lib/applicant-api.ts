import { ApiError } from "./api-client"

export type ApplicantChoice = {
  preferenceRank: 1 | 2
  positionId: string
  title: string
  committeeId: string
  committee: string
}

export type ApplicantDocument = {
  documentType: "resume" | "transcript"
  fileName: string
}

export type ApplicantApplication = {
  applicationCode: string
  firstName: string
  lastName: string
  email: string
  age: number | null
  section: string | null
  motivation: string
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
    let message = `Request failed (${response.status})`
    try {
      const body: unknown = await response.json()
      if (
        body &&
        typeof body === "object" &&
        "error" in body &&
        typeof body.error === "string"
      ) {
        message = body.error
      }
    } catch {
      // Keep the status fallback when the API does not return JSON.
    }
    throw new ApiError(response.status, message)
  }

  return response.json() as Promise<T>
}

export function getApplicantApplication() {
  return applicantFetch<ApplicantApplication>("/applicant/application")
}

export function updateApplicantChoices(body: {
  choices: { positionId: string; preferenceRank: 1 | 2 }[]
  slotId?: string
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

export async function logoutApplicant() {
  try {
    await applicantFetch<void>("/applicant-auth/logout", { method: "POST" })
  } catch {
    // Still leave the dashboard even if logout fails.
  }
}
