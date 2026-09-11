"use client"

import { useEffect, useState } from "react"
import { PositionsBrowser } from "@/components/positions-browser"
import { PositionsBrowserSkeleton } from "@/components/positions-browser-skeleton"
import { listBrowserPositions, peekBrowserPositions } from "@/lib/api-client"
import type { Position } from "@/lib/positions"

export function PositionsPageClient() {
  const cached = peekBrowserPositions()
  const [positions, setPositions] = useState<Position[]>(cached ?? [])
  const [loadError, setLoadError] = useState(false)
  const [loading, setLoading] = useState(!cached)

  useEffect(() => {
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

  return <PositionsBrowser positions={positions} loadError={loadError} />
}
