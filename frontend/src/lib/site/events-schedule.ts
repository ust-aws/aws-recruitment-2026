export type EventsPageTimelineItem = {
  id: string
  tag: string
  title: string
  description: string
}

export const EVENTS_PAGE_TIMELINE: EventsPageTimelineItem[] = [
  {
    id: "r101",
    tag: "Recruitment - R101",
    title: "Recruitment 101",
    description:
      "Our yearly application period — the main way to join AWS Builders – UST.",
  },
  {
    id: "workshops",
    tag: "Workshop series",
    title: "Cloud & AI Foundations",
    description:
      "Beginner-friendly sessions covering core cloud concepts and applied AI, open to all members.",
  },
  {
    id: "build-sprint",
    tag: "Build Sprint",
    title: "Build Your First Stack Day",
    description:
      "A hands-on session where new members deploy their very first real cloud stack.",
  },
  {
    id: "tba",
    tag: "TBA",
    title: "More Events to come",
    description: "Full events calendar to be documented here in the real build.",
  },
]

/** Mock calendar highlights for August 2026 (see Events page). */
export const EVENTS_CALENDAR_MONTH_LABEL = "August 2026"

export const EVENTS_CALENDAR_SCHEDULED_DAYS = new Set([5, 12, 19, 26])

export const EVENTS_CALENDAR_OUTLINED_DAY = 11
