"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/auth/session-server"

const API_BASE = process.env.API_URL ?? "http://localhost:8787"
const AUTH_COOKIE_NAME = "hr_token"
const DEFAULT_EXPIRES_SECONDS = 8 * 60 * 60

export type LoginState = {
  error?: string
}

function expiresInSeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN ?? "8h"
  const hours = raw.endsWith("h") ? Number(raw.slice(0, -1)) : Number.NaN
  if (!Number.isFinite(hours) || hours <= 0) return DEFAULT_EXPIRES_SECONDS
  return Math.floor(hours * 60 * 60)
}

function trustedOriginHeader(): string {
  return (
    process.env.CORS_ORIGIN ??
    process.env.APP_BASE_URL ??
    "http://localhost:3000"
  )
}

function usesSecureCookies(): boolean {
  if (process.env.NODE_ENV === "production") return true
  const candidates = [process.env.CORS_ORIGIN, process.env.APP_BASE_URL]
  return candidates.some((value) =>
    value?.trim().toLowerCase().startsWith("https://"),
  )
}

function extractHrTokenFromResponse(response: Response): string | null {
  const setCookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : []
  const legacy = response.headers.get("set-cookie")
  const rawCookies = legacy ? [...setCookies, legacy] : setCookies

  for (const cookie of rawCookies) {
    const pair = cookie.split(";")[0]?.trim()
    if (!pair) continue
    const eq = pair.indexOf("=")
    if (eq === -1) continue
    const name = pair.slice(0, eq)
    if (name === AUTH_COOKIE_NAME) {
      return pair.slice(eq + 1)
    }
  }
  return null
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = formData.get("email")
  const password = formData.get("password")

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Email and password are required." }
  }

  let response: Response
  try {
    response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Origin: trustedOriginHeader(),
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })
  } catch {
    return { error: "Could not reach the API." }
  }

  if (!response.ok) {
    if (response.status === 401) {
      return { error: "Invalid credentials" }
    }
    return { error: "Could not sign in." }
  }

  const tokenFromCookie = extractHrTokenFromResponse(response)
  const body = (await response.json()) as { token?: string }
  const token = tokenFromCookie ?? body.token
  if (!token) {
    return { error: "Could not sign in." }
  }

  const maxAge = expiresInSeconds()
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: usesSecureCookies(),
    sameSite: "lax",
    path: "/",
    maxAge,
  })

  redirect("/admin/hr")
}

export async function logoutHrSession(): Promise<void> {
  const session = await getServerSession()
  if (!session) {
    redirect("/login")
  }

  const cookieStore = await cookies()
  cookieStore.delete(AUTH_COOKIE_NAME)

  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Origin: trustedOriginHeader() },
      cache: "no-store",
    })
  } catch {
    // Cookie is already cleared for the Next app; ignore API errors.
  }

  redirect("/login")
}
