import { cookies } from "next/headers"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787"

export async function getServerSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("hr_token")
  if (!token?.value) return null

  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: { Cookie: `hr_token=${token.value}` },
      cache: "no-store",
    })
    if (!response.ok) {
      cookieStore.delete("hr_token")
      return null
    }
    return (await response.json()) as { email: string }
  } catch {
    return null
  }
}
