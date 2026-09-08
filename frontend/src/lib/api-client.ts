import type {
  Application,
  ApplicationStatus,
  CreateApplicationInput,
  Position,
} from "./application-types"

const API_BASE = "/api"

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return
  if (window.location.pathname === "/login") return
  window.location.replace("/login")
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "content-type": "application/json" } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 401 && path !== "/auth/login") {
      redirectToLogin()
    }
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

type LoginResponse = {
  email: string
  expiresAt: string
}

export async function getSession(): Promise<{ email: string }> {
  return apiFetch<{ email: string }>("/auth/me")
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    return await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  } catch (err) {
    if (err instanceof TypeError) {
      throw new ApiError(0, "Could not reach the API")
    }
    if (err instanceof ApiError && err.status === 401) {
      throw new ApiError(401, "Invalid credentials")
    }
    throw err
  }
}

export async function logout(): Promise<void> {
  try {
    await apiFetch<void>("/auth/logout", {
      method: "POST",
    })
  } catch {
    // Client still navigates away even if the request fails.
  }
}
