export const APPLY_UNEXPECTED_ERROR =
  "An unexpected error occurred. Please try again."

export const APPLY_MISSING_DOCUMENTS_ERROR =
  "Please attach your Curriculum Vitae and Registration Form."

export function isApplicantUploadFailureMessage(message: string): boolean {
  if (message === APPLY_UNEXPECTED_ERROR) return true
  const lower = message.toLowerCase()
  return (
    lower.includes("upload session") ||
    lower.includes("could not upload the pdf") ||
    lower.includes("could not create an upload") ||
    lower.includes("failed to fetch")
  )
}

/** Replaces generic backend/dev upload failures with applicant-safe copy. */
export function sanitizeApplicantApiMessage(message: string): string {
  if (isApplicantUploadFailureMessage(message)) {
    return APPLY_UNEXPECTED_ERROR
  }
  return message
}

export async function readApiErrorMessage(
  response: Response
): Promise<string | null> {
  try {
    const body: unknown = await response.json()
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string" &&
      body.error.trim()
    ) {
      return body.error
    }
  } catch {
    // Non-JSON error bodies fall through to status-based messaging.
  }
  return null
}

export function userFacingApiError(
  status: number,
  serverMessage: string | null,
  fallback = "Something went wrong. Please try again."
): string {
  if (serverMessage) return sanitizeApplicantApiMessage(serverMessage)

  if (status === 401) {
    return "Your session expired. Sign in again to continue."
  }
  if (status === 403) {
    return "You don't have permission to do that."
  }
  if (status === 404) {
    return "We couldn't find what you asked for."
  }
  if (status === 409) {
    return "That action is no longer available. Refresh and try again."
  }
  if (status === 503) {
    return "This feature is temporarily unavailable. Try again in a moment."
  }
  if (status >= 500) {
    return "Something went wrong on our side. Try again in a moment."
  }

  return fallback
}
