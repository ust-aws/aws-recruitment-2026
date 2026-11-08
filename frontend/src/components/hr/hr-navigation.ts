import {
  Archive,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  Crown,
  IdCard,
  LayoutDashboard,
  MessagesSquare,
  Send,
  Settings2,
  Users,
  WalletCards,
} from "lucide-react"

export type HrRole = "hr" | "admin"

/** The two rounds that share one pipeline: R101, and the hunt for the next board. */
export type HrRound = "r101" | "officer_hunt"

export const hrRounds: { round: HrRound; label: string }[] = [
  { round: "r101", label: "R101" },
  { round: "officer_hunt", label: "Officer Hunt" },
]

export type HrNavigationItem = {
  label: string
  /** Said by the tooltip when the rail is collapsed and the label alone is ambiguous. */
  tooltip?: string
  href: string
  icon: typeof Archive
  active: (pathname: string, source: string | null) => boolean
}

export type HrNavigationSection = {
  /** Group heading; null for the home item, which stands alone. */
  label: string | null
  /** "end" pins the group to the foot of the sidebar. */
  placement?: "end"
  visible: (role: HrRole) => boolean
  /**
   * What the group lists. Per-round lists make one group serve both rounds,
   * with a switch to pick which one the rows belong to.
   */
  items: HrNavigationItem[] | Record<HrRound, HrNavigationItem[]>
  /**
   * Folds the group into one row, open while the current page is inside it.
   * For configuration, which is visited a few times a season.
   */
  fold?: { label: string; icon: typeof Archive }
}

export function hasRounds(
  items: HrNavigationSection["items"],
): items is Record<HrRound, HrNavigationItem[]> {
  return !Array.isArray(items)
}

/** The round a page belongs to; everything outside the hunt's pages is R101's. */
export function hrRoundFromPath(pathname: string): HrRound {
  return pathname.startsWith("/admin/hr/officer-hunt") ? "officer_hunt" : "r101"
}

/**
 * Where the switch sends you: the same kind of page in the other round
 * (Results to Results), or that round's first page from anywhere else.
 */
export function roundCounterpartHref(
  items: Record<HrRound, HrNavigationItem[]>,
  target: HrRound,
  pathname: string,
  source: string | null,
): string {
  const from = hrRoundFromPath(pathname)
  const index = items[from].findIndex((item) => item.active(pathname, source))
  const list = items[target]
  return (list[Math.min(Math.max(index, 0), list.length - 1)] ?? list[0]).href
}

function isApplicationDetailPath(pathname: string) {
  const match = new RegExp("^/admin/hr/([^/]+)$").exec(pathname)
  return Boolean(
    match &&
      ![
        "season",
        "results",
        "archive",
        "payments",
        "membership",
        "committees",
        "groups",
        "members",
        "overview",
        "officer-hunt",
      ].includes(match[1]),
  )
}

export const hrNavigationSections: HrNavigationSection[] = [
  {
    // Home: no label, it is the page everything else hangs off.
    label: null,
    visible: () => true,
    items: [
      {
        label: "Overview",
        href: "/admin/hr/overview",
        icon: LayoutDashboard,
        active: (path) => path.startsWith("/admin/hr/overview"),
      },
    ],
  },
  {
    // The applicant pipeline, in the order work happens. R101 and the officer
    // hunt run it side by side, so it is one group with a round switch.
    label: "Recruitment",
    visible: () => true,
    items: {
      r101: [
        {
          label: "Applications",
          href: "/admin/hr",
          icon: ClipboardList,
          active: (path, source) =>
            path === "/admin/hr" ||
            (isApplicationDetailPath(path) && source !== "archive"),
        },
        {
          label: "Results",
          href: "/admin/hr/results",
          icon: Send,
          active: (path) => path.startsWith("/admin/hr/results"),
        },
        {
          label: "Archive",
          href: "/admin/hr/archive",
          icon: Archive,
          active: (path, source) =>
            path.startsWith("/admin/hr/archive") ||
            (source === "archive" && isApplicationDetailPath(path)),
        },
      ],
      officer_hunt: [
        {
          label: "Applications",
          tooltip: "Hunt Applications",
          href: "/admin/hr/officer-hunt",
          icon: Crown,
          active: (path) => path === "/admin/hr/officer-hunt",
        },
        {
          label: "Results",
          tooltip: "Hunt Results",
          href: "/admin/hr/officer-hunt/results",
          icon: Send,
          active: (path) => path.startsWith("/admin/hr/officer-hunt/results"),
        },
      ],
    },
  },
  {
    // Once applicants become members: who they are, what they paid, where they chat.
    label: "Membership",
    visible: () => true,
    items: [
      {
        label: "Members",
        href: "/admin/hr/members",
        icon: IdCard,
        active: (path) => path.startsWith("/admin/hr/members"),
      },
      {
        label: "Payments",
        href: "/admin/hr/payments",
        icon: WalletCards,
        // Verification merged into Payments; the old address redirects here.
        active: (path) => path === "/admin/hr/payments" || path.startsWith("/admin/hr/membership"),
      },
      {
        label: "Community Links",
        href: "/admin/hr/groups",
        icon: MessagesSquare,
        active: (path) => path.startsWith("/admin/hr/groups"),
      },
    ],
  },
  {
    // Configuration, visited a few times a season: pinned to the foot and folded
    // to one row, so the daily work above stays short and in reach.
    label: null,
    placement: "end",
    visible: () => true,
    fold: { label: "Setup", icon: Settings2 },
    items: [
      {
        label: "R101 Season",
        tooltip: "R101 Season Setup",
        href: "/admin/hr/season",
        icon: CalendarRange,
        active: (path) => path.startsWith("/admin/hr/season"),
      },
      {
        label: "Officer Hunt",
        tooltip: "Officer Hunt Setup",
        href: "/admin/hr/officer-hunt/setup",
        icon: Crown,
        active: (path) => path.startsWith("/admin/hr/officer-hunt/setup"),
      },
      {
        label: "Committees",
        href: "/admin/hr/committees",
        icon: Users,
        active: (path) => path.startsWith("/admin/hr/committees"),
      },
      {
        label: "Payment Period",
        tooltip: "Payment Setup",
        href: "/admin/hr/payments/setup",
        icon: CalendarClock,
        active: (path) => path.startsWith("/admin/hr/payments/setup"),
      },
    ],
  },
]

export function hrWorkspaceTitle(role: HrRole) {
  if (role === "admin") return "Admin Dashboard"
  return "HR Dashboard"
}
