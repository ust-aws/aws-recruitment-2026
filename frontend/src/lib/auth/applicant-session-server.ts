import { cookies } from "next/headers"

const API_BASE = process.env.API_URL ?? "http://localhost:8787"
const APPLICANT_AUTH_COOKIE_NAME = "applicant_token"

export async function getApplicantServerSession(): Promise<{
  applicationCode: string
} | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(APPLICANT_AUTH_COOKIE_NAME)
  if (!token?.value) return null

  try {
    const response = await fetch(`${API_BASE}/applicant-auth/me`, {
      headers: { Cookie: `${APPLICANT_AUTH_COOKIE_NAME}=${token.value}` },
      cache: "no-store",
    })
    if (!response.ok) return null
    return (await response.json()) as { applicationCode: string }
  } catch {
    return null
  }
}
