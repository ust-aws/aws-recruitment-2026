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
  if (serverMessage) return serverMessage

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
