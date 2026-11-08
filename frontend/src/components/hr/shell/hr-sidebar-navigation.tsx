"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  hasRounds,
  hrNavigationSections,
  hrRoundFromPath,
  type HrNavigationSection,
  type HrRole,
} from "@/components/hr/shell/hr-navigation"
import { HrRoundSwitch } from "@/components/hr/shell/hr-round-switch"
import { HrSidebarFold } from "@/components/hr/shell/hr-sidebar-fold"
import { HrSidebarMenu } from "@/components/hr/shell/hr-sidebar-menu"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { formatSubheaderLabel } from "@/lib/site/button-label"

// Group names are 10px mono (the one place that size is kept); calm prelude
// instead of violet, so the labels sort the list without competing with it.
const groupLabelClasses =
  "mb-1.5 h-auto px-3 font-mono text-[10px] tracking-[0.16em] text-prelude/70 group-data-[collapsible=icon]:mb-0 group-data-[collapsible=icon]:sr-only"
// Every group below the first is set off by a hairline, expanded or collapsed,
// so the grouping reads at a glance. Setup is pushed to the foot.
const navigationWrapperClasses =
  "flex min-h-full w-full flex-col gap-4 group-data-[collapsible=icon]:gap-3"
const groupClasses = "p-0"
const groupDividerClasses =
  "border-t border-blue-chalk/15 pt-4 group-data-[collapsible=icon]:pt-3"
const endGroupClasses = "mt-auto"

type BodyProps = { section: HrNavigationSection; pathname: string; source: string | null }

function SectionBody({ section, pathname, source }: BodyProps) {
  if (hasRounds(section.items)) {
    const items = section.items
    return (
      <>
        <HrRoundSwitch items={items} pathname={pathname} source={source} />
        <HrSidebarMenu items={items[hrRoundFromPath(pathname)]} pathname={pathname} source={source} />
      </>
    )
  }
  if (section.fold) {
    return <HrSidebarFold fold={section.fold} items={section.items} pathname={pathname} source={source} />
  }
  return <HrSidebarMenu items={section.items} pathname={pathname} source={source} />
}

export function HrSidebarNavigation({ role }: { role: HrRole }) {
  const pathname = usePathname()
  const source = useSearchParams().get("source")

  // On a short window the list scrolls; keep the current page in view.
  useEffect(() => {
    document.querySelector('[data-sidebar="content"] [aria-current="page"]')?.scrollIntoView({ block: "nearest" })
  }, [pathname])

  return (
    <nav className={navigationWrapperClasses} aria-label="Dashboard">
      {hrNavigationSections.map((section) =>
        section.visible(role) ? (
          <SidebarGroup
            key={section.label ?? section.fold?.label ?? "home"}
            className={cn(
              groupClasses,
              (section.label || section.fold) && groupDividerClasses,
              section.placement === "end" && endGroupClasses,
            )}
          >
            {section.label ? (
              <SidebarGroupLabel className={groupLabelClasses}>
                {formatSubheaderLabel(section.label)}
              </SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SectionBody section={section} pathname={pathname} source={source} />
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null,
      )}
    </nav>
  )
}
