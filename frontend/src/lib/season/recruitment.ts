import type { RecruitmentWindow } from "@/lib/api/client"

const EMAIL_TZ = "Asia/Manila"

export function formatRecruitmentOpensAt(startsAt: string): string {
  const date = new Date(startsAt)
  if (Number.isNaN(date.getTime())) return ""
  return date.toLocaleString("en-PH", {
    timeZone: EMAIL_TZ,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function recruitmentClosedMessage(window: RecruitmentWindow): string {
  if (window.message) return window.message
  if (window.code === "recruitment_not_started" && window.startsAt) {
    return `Applications open on ${formatRecruitmentOpensAt(window.startsAt)}.`
  }
  return "Applications are not open right now."
}
