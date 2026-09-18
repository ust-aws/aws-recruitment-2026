import { ApiError } from "@/lib/api/client"
import {
  readApiErrorMessage,
  userFacingApiError,
} from "@/lib/api/error-message"

const API_BASE = "/api/applicant-auth"

export type ApplicantIdentity = {
  applicationCode: string
  email: string
}

async function applicantAuthFetch<T>(
  path: string,
  body: Record<string, string>
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const serverMessage = await readApiErrorMessage(response)
    const fallback =
      response.status === 401
        ? "The verification code is invalid or expired."
        : response.status === 429
          ? "Too many code requests. Wait and try again."
          : "Could not verify your code. Try again in a moment."
    throw new ApiError(
      response.status,
      userFacingApiError(response.status, serverMessage, fallback)
    )
  }

  return response.json() as Promise<T>
}

export async function getApplicantAuthMe() {
  const response = await fetch(`${API_BASE}/me`, {
    method: "GET",
    credentials: "include",
  })
  if (response.status === 401) return null
  if (!response.ok) {
    const serverMessage = await readApiErrorMessage(response)
    throw new ApiError(
      response.status,
      userFacingApiError(
        response.status,
        serverMessage,
        "Could not verify your session."
      )
    )
  }
  return response.json() as Promise<{ applicationCode: string }>
}

export function requestApplicantCode(identity: ApplicantIdentity) {
  return applicantAuthFetch<{ message: string }>("/request-code", identity)
}

export function verifyApplicantCode(
  identity: ApplicantIdentity & { code: string }
) {
  return applicantAuthFetch<{
    applicationCode: string
    expiresAt: string
  }>("/verify-code", identity)
}
