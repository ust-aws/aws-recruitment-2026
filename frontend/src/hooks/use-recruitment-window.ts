"use client"

import { useEffect, useState } from "react"
import { getRecruitmentWindow, type RecruitmentWindow } from "@/lib/api/client"

export function useRecruitmentWindow() {
  const [window, setWindow] = useState<RecruitmentWindow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    getRecruitmentWindow()
      .then((payload) => {
        if (cancelled) return
        setWindow(payload)
        setError("")
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setWindow(null)
        setError(
          err instanceof Error
            ? err.message
            : "Could not load the recruitment schedule.",
        )
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return {
    window,
    loading,
    error,
    applicationsOpen: window?.open === true,
  }
}
