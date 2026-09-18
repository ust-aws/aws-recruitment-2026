"use client"

import { useEffect, useState } from "react"
import { PositionsBrowser } from "@/components/positions/browser"
import { PositionsBrowserSkeleton } from "@/components/positions/browser-skeleton"
import { listBrowserPositions, peekBrowserPositions } from "@/lib/api/client"
import { useRecruitmentWindow } from "@/hooks/use-recruitment-window"
import type { Position } from "@/lib/positions"

export function PositionsPageClient() {
  const { applicationsOpen } = useRecruitmentWindow()
  const [positions, setPositions] = useState<Position[]>([])
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = peekBrowserPositions()
    if (cached) {
      setPositions(cached)
      setLoading(false)
    }

    let cancelled = false
    listBrowserPositions()
      .then((rows) => {
        if (cancelled) return
        setPositions(rows)
        setLoadError(false)
      })
      .catch(() => {
        if (cancelled) return
        setPositions([])
        setLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading && positions.length === 0) {
    return <PositionsBrowserSkeleton />
  }

  return (
    <PositionsBrowser
      positions={positions}
      loadError={loadError}
      applicationsOpen={applicationsOpen}
    />
  )
}
