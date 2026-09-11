"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getInterviewWindow,
  type InterviewWindow,
} from "@/lib/api-client"
import {
  interviewSeasonBoundsFromPayload,
  type InterviewSeasonBounds,
} from "@/lib/interview-season"

export function useInterviewWindow() {
  const [bounds, setBounds] = useState<InterviewSeasonBounds>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const applyPayload = useCallback((payload: InterviewWindow) => {
    setBounds(interviewSeasonBoundsFromPayload(payload))
    setError("")
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    getInterviewWindow()
      .then((payload) => {
        if (cancelled) return
        setBounds(interviewSeasonBoundsFromPayload(payload))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setBounds(null)
        setError(
          err instanceof Error
            ? err.message
            : "Could not load the interview season."
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
    bounds,
    loading,
    error,
    configured: bounds !== null,
    applyPayload,
  }
}
