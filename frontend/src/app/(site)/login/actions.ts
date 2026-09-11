"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787"
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
      headers: { "content-type": "application/json" },
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

  const body = (await response.json()) as { token?: string }
  if (!body.token) {
    return { error: "Could not sign in." }
  }

  const maxAge = expiresInSeconds()
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, body.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  })

  redirect("/admin/hr")
}

export async function logoutHrSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("hr_token")

  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      cache: "no-store",
    })
  } catch {
    // Cookie is already cleared for the Next app; ignore API errors.
  }

  redirect("/login")
}
