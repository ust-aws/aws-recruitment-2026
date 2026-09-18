"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRecruitmentWindow } from "@/hooks/use-recruitment-window"
import { formatDisplayDate } from "@/lib/datetime/display"

const bannerClasses =
  "glass flex w-[min(92vw,680px)] flex-col items-center justify-between gap-3 rounded-[14px] border border-aquamarine/35 bg-haiti/55 px-4 py-3 text-left sm:flex-row sm:px-5"
const copyClasses = "min-w-0 text-center sm:text-left"
const statusClasses =
  "font-mono text-xs font-semibold uppercase tracking-[0.12em] text-aquamarine"
const scheduleClasses = "mt-1 font-sans text-xs text-blue-chalk/85 sm:text-sm"

function formatCountdown(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return totalMinutes > 0 ? `${totalMinutes}m` : "less than a minute"
}

function formatWindowRange(startsAt: Date, endsAt: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
  return `${formatDisplayDate(startsAt, options)} – ${formatDisplayDate(endsAt, options)}`
}

export function RecruitmentStatusBanner() {
  const { window, loading, error } = useRecruitmentWindow()
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    const timer = globalThis.setInterval(() => setNow(Date.now()), 60_000)
    return () => globalThis.clearInterval(timer)
  }, [])

  if (loading || error) return null

  if (!window?.startsAt || !window.endsAt) {
    return (
      <aside aria-label="Recruitment status" className={bannerClasses}>
        <div className={copyClasses}>
          <p className={statusClasses}>Recruitment dates coming soon</p>
          <p className={scheduleClasses}>Explore the available teams while you wait.</p>
        </div>
        <Button
          color="purple"
          size="sm"
          nativeButton={false}
          render={<Link href="/apply/positions" />}
        >
          View positions
        </Button>
      </aside>
    )
  }

  const startsAt = new Date(window.startsAt)
  const endsAt = new Date(window.endsAt)
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return null
  }

  const schedule = formatWindowRange(startsAt, endsAt)
  const beforeWindow = now < startsAt.getTime()
  const duringWindow = now >= startsAt.getTime() && now < endsAt.getTime()
  const status = beforeWindow
    ? `Applications open in ${formatCountdown(startsAt.getTime() - now)}`
    : duringWindow
      ? `Applications close in ${formatCountdown(endsAt.getTime() - now)}`
      : "Applications are closed"

  return (
    <aside aria-label="Recruitment status" className={bannerClasses}>
      <div className={copyClasses}>
        <p className={statusClasses}>{status}</p>
        <p className={scheduleClasses}>R101 application period · {schedule}</p>
      </div>
      <Button
        color={duringWindow ? "cyan" : "purple"}
        size="sm"
        nativeButton={false}
        render={<Link href="/apply/positions" />}
      >
        {duringWindow ? "Apply now" : "View positions"}
      </Button>
    </aside>
  )
}
