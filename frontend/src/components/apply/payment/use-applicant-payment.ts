"use client"

import { useEffect, useState } from "react"
import { getApplicantPayment, type ApplicantPayment, type MemberCard } from "@/lib/api/applicant"

export type InitialApplicantPayment = { payment: ApplicantPayment | null } | null

/**
 * The applicant's membership payment, loaded once for the whole dashboard:
 * the R101 trail reads it to place "you are here", the payment panel renders it.
 * `initial` comes from the server render; null means it was not loaded there.
 */
export function useApplicantPayment(initial: InitialApplicantPayment = null) {
  const [payment, setPayment] = useState<ApplicantPayment | null>(initial?.payment ?? null)
  const [loading, setLoading] = useState(initial === null)
  const [error, setError] = useState("")
  const loadedOnServer = initial !== null

  useEffect(() => {
    if (loadedOnServer) return
    let active = true
    getApplicantPayment()
      .then((response) => {
        if (active) setPayment(response.payment)
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Could not load payment details.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [loadedOnServer])

  async function refresh() {
    const response = await getApplicantPayment()
    setPayment(response.payment)
  }

  function setMemberCard(memberCard: MemberCard) {
    setPayment((current) => (current ? { ...current, memberCard } : current))
  }

  return { payment, loading, error, refresh, setMemberCard }
}

export type ApplicantPaymentState = ReturnType<typeof useApplicantPayment>
