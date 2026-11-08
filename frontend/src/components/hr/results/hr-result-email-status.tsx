"use client"

import { useEffect, useState } from "react"
import { HrResultEmailProblems } from "@/components/hr/results/hr-result-email-problems"
import {
  getResultEmailStatus,
  markResultEmailsDeliveredRequest,
  resendResultEmailsRequest,
  type ResultEmailStatus,
} from "@/lib/api/client"
import { useRecruitmentTrack } from "@/lib/recruitment-track"
import type { RecruitmentTrack } from "@/lib/types/track"
import { formatSubheaderLabel } from "@/lib/site/button-label"
import { glassPanelClasses, subheaderLabelClasses } from "@/lib/site/surface"

const panelClasses = `${glassPanelClasses} rounded-[20px] px-5 py-5`
const titleClasses = "font-sans text-lg font-bold text-blue-chalk"
const copyClasses = "mt-1 font-sans text-sm leading-relaxed text-prelude"
const statsClasses = "mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
const statClasses = "rounded-[14px] bg-haiti/55 px-4 py-3"
const statValueClasses = "mt-1 font-sans text-2xl font-bold text-blue-chalk"
const POLL_MS = 5_000

function progressCopy(status: ResultEmailStatus) {
  const inProgress = status.queued + status.sending
  if (inProgress > 0) {
    return `Sending result emails in the background, a few per second. ${inProgress} still to go. You can leave this page; sending continues.`
  }
  if (status.failed + status.uncertain > 0) return "Sending finished. Some emails need attention below."
  return "All result emails have been sent."
}

/** Live delivery progress for released result emails. */
export function HrResultEmailStatus({ refreshKey }: { refreshKey: number }) {
  const track = useRecruitmentTrack()
  const [status, setStatus] = useState<ResultEmailStatus | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const inProgress = status ? status.queued + status.sending > 0 : false

  useEffect(() => {
    let cancelled = false
    const load = () =>
      getResultEmailStatus(track)
        .then((next) => {
          if (!cancelled) {
            setStatus(next)
            setError("")
          }
        })
        .catch((caught: unknown) => {
          if (!cancelled) setError(caught instanceof Error ? caught.message : "Could not load email progress.")
        })
    void load()
    if (!inProgress) {
      return () => {
        cancelled = true
      }
    }
    const timer = setInterval(() => void load(), POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [refreshKey, reloadKey, inProgress, track])

  async function updateSelected(
    request: (ids: string[], track: RecruitmentTrack) => Promise<unknown>,
    failure: string,
    ids: string[],
  ) {
    setBusy(true)
    try {
      await request(ids, track)
      setReloadKey((key) => key + 1)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : failure)
    } finally {
      setBusy(false)
    }
  }

  if (!status || status.sent + status.queued + status.sending + status.failed + status.uncertain === 0) {
    return error ? <p className={copyClasses}>{error}</p> : null
  }
  const stats = [
    ["Sent", status.sent],
    ["In progress", status.queued + status.sending],
    ["Failed", status.failed],
    ["Uncertain", status.uncertain],
  ] as const

  return (
    <section className={panelClasses} aria-live="polite">
      <h3 className={titleClasses}>Result Emails</h3>
      <p className={copyClasses}>{error || progressCopy(status)}</p>
      <div className={statsClasses}>
        {stats.map(([label, value]) => (
          <div key={label} className={statClasses}>
            <p className={subheaderLabelClasses}>{formatSubheaderLabel(label)}</p>
            <p className={statValueClasses}>{value}</p>
          </div>
        ))}
      </div>
      <HrResultEmailProblems
        problems={status.problems}
        busy={busy}
        onResendSelected={(ids) => updateSelected(resendResultEmailsRequest, "Could not resend those emails.", ids)}
        onMarkDelivered={(ids) =>
          updateSelected(markResultEmailsDeliveredRequest, "Could not mark those emails as delivered.", ids)
        }
      />
    </section>
  )
}
