"use client"

import Link from "next/link"
import { ArrowLeftRight } from "lucide-react"
import {
  hrRoundFromPath,
  hrRounds,
  roundCounterpartHref,
  type HrNavigationItem,
  type HrRound,
} from "@/components/hr/shell/hr-navigation"
import { labelClasses, rowClasses, tooltipClasses } from "@/components/hr/shell/hr-sidebar-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

// Two segments in one track. The chosen round is the filled one, the same fill
// the current page gets, so the sidebar has one idea of "you are here".
const trackClasses =
  "mb-2 grid grid-cols-2 gap-1 rounded-pill border border-blue-chalk/15 bg-haiti/60 p-1 group-data-[collapsible=icon]:hidden"
const segmentClasses =
  "grid h-7 place-items-center rounded-pill border border-transparent px-2 text-xs font-medium text-prelude transition-[background-color,border-color,color] duration-200 ease-out hover:text-blue-chalk focus-visible:ring-2 focus-visible:ring-aquamarine/60 pointer-coarse:h-9 motion-reduce:transition-none"
const chosenSegmentClasses =
  "border-biloba-flower/40 bg-daisy-bush/55 text-blue-chalk hover:text-blue-chalk"
// The collapsed rail has no room for two segments: one button flips the round.
const railOnlyClasses = "mb-0.5 hidden group-data-[collapsible=icon]:flex"

type SwitchProps = {
  items: Record<HrRound, HrNavigationItem[]>
  pathname: string
  source: string | null
}

/** Picks which round the Recruitment rows below belong to: R101 or the Officer Hunt. */
export function HrRoundSwitch({ items, pathname, source }: SwitchProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const current = hrRoundFromPath(pathname)
  const other = hrRounds.find((round) => round.round !== current)!
  const close = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <>
      <div className={trackClasses} role="group" aria-label="Recruitment round">
        {hrRounds.map(({ round, label }) => {
          const chosen = round === current
          return (
            <Link
              key={round}
              href={roundCounterpartHref(items, round, pathname, source)}
              aria-current={chosen ? "true" : undefined}
              className={cn(segmentClasses, chosen && chosenSegmentClasses)}
              onClick={close}
            >
              {label}
            </Link>
          )
        })}
      </div>
      <SidebarMenu className={railOnlyClasses}>
        <SidebarMenuItem className="flex w-full justify-center">
          <SidebarMenuButton
            tooltip={{
              children: `Switch to ${other.label}`,
              className: tooltipClasses,
              side: "right",
              sideOffset: 10,
            }}
            className={rowClasses}
            render={<Link href={roundCounterpartHref(items, other.round, pathname, source)} onClick={close} />}
          >
            <ArrowLeftRight className="size-4 shrink-0" />
            <span className={labelClasses}>Switch to {other.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  )
}
