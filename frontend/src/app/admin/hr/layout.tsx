"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSession } from "@/lib/api-client"
import { clearToken, getToken } from "@/lib/auth"

export default function AdminHrLayout({ children }: LayoutProps<"/admin/hr">) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function verifySession() {
      if (!getToken()) {
        router.replace("/login")
        return
      }

      try {
        await getSession()
        if (!cancelled) setReady(true)
      } catch {
        clearToken()
        if (!cancelled) router.replace("/login")
      }
    }

    void verifySession()
    return () => {
      cancelled = true
    }
  }, [router])

  if (!ready) return null
  return children
}
