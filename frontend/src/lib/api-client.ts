import type {
  Application,
  ApplicationStatus,
  CreateApplicationInput,
  Position,
} from "./application-types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787"

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  })

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
      // keep the status fallback
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function listApplications() {
  return apiFetch<{ applications: Application[]; total: number }>(
    "/applications"
  ).then((body) => body.applications)
}

export function getApplicationById(id: string) {
  return apiFetch<Application>(`/applications/${id}`)
}

export function postApplication(body: CreateApplicationInput) {
  return apiFetch<Application>("/applications", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function patchApplicationStatusRequest(
  id: string,
  status: ApplicationStatus
) {
  return apiFetch<Application>(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
}

export function listOpenPositions() {
  return apiFetch<Position[]>("/positions")
}
