"use client"

import { ChevronRight } from "lucide-react"
import type { HrNavigationItem, HrNavigationSection } from "@/components/hr/shell/hr-navigation"
import { HrSidebarMenu, labelClasses, rowClasses } from "@/components/hr/shell/hr-sidebar-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const chevronClasses =
  "ml-auto size-3.5 shrink-0 text-prelude/70 transition-transform duration-200 ease-out in-data-[panel-open]:rotate-90 group-data-[collapsible=icon]:hidden motion-reduce:transition-none"
// A hairline guides the eye down from the row to the pages it holds.
const panelClasses =
  "h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none"
const nestedMenuClasses = "ml-5 mt-0.5 w-auto border-l border-blue-chalk/15 pl-2"

type FoldProps = {
  fold: NonNullable<HrNavigationSection["fold"]>
  items: HrNavigationItem[]
  pathname: string
  source: string | null
}

/** A group folded to one row, open while the current page is inside it. */
export function HrSidebarFold({ fold, items, pathname, source }: FoldProps) {
  const { state, isMobile } = useSidebar()
  const Icon = fold.icon
  const inside = items.some((item) => item.active(pathname, source))

  // The icon rail has no room for a fold: it lists the pages directly.
  if (state === "collapsed" && !isMobile) {
    return <HrSidebarMenu items={items} pathname={pathname} source={source} />
  }

  // Entering or leaving the group remounts it, so it opens for a page inside it
  // and stays however you toggle it while you are there.
  return (
    <Collapsible key={inside ? "inside" : "outside"} defaultOpen={inside}>
      <CollapsibleTrigger className={cn(rowClasses, "flex items-center")}>
        <Icon className="size-4 shrink-0" />
        <span className={labelClasses}>{fold.label}</span>
        <ChevronRight className={chevronClasses} aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className={panelClasses}>
        <HrSidebarMenu items={items} pathname={pathname} source={source} className={nestedMenuClasses} />
      </CollapsibleContent>
    </Collapsible>
  )
}
