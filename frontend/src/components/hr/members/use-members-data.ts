"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getDirectoryMembers,
  getPaymentDashboard,
  type DirectoryMember,
  type PaymentListItem,
  type PendingOfficer,
} from "@/lib/api/payments"

type MembersData = {
  verified: DirectoryMember[]
  pendingOfficers: PendingOfficer[]
  payments: PaymentListItem[]
}

/** Loads the paid members and everyone's payments together, with a way to try again. */
export function useMembersData() {
  const [data, setData] = useState<MembersData | null>(null)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    Promise.all([getDirectoryMembers(), getPaymentDashboard()])
      .then(([directory, dashboard]) => {
        if (cancelled) return
        setError("")
        setData({
          verified: directory.members,
          pendingOfficers: directory.pendingOfficers,
          payments: dashboard.payments,
        })
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not load the members.")
        }
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const retry = useCallback(() => {
    setData(null)
    setError("")
    setAttempt((value) => value + 1)
  }, [])

  return { data, error, retry }
}
