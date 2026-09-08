import { ApiError } from "./api-client"

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
    let message = `Request failed (${response.status})`
    try {
      const payload: unknown = await response.json()
      if (
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof payload.error === "string"
      ) {
        message = payload.error
      }
    } catch {
      // Keep the status fallback when the API does not return JSON.
    }
    throw new ApiError(response.status, message)
  }

  return response.json() as Promise<T>
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
