"use client"

import Link from "next/link"
import type { HrNavigationItem } from "@/components/hr/hr-navigation"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

const menuClasses = "w-full gap-0.5 group-data-[collapsible=icon]:items-center"
const itemClasses =
  "w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
export const rowClasses =
  "h-9 w-full justify-start gap-3 rounded-pill border border-transparent px-3 text-left text-sm font-medium text-prelude transition-[background-color,border-color,color] duration-200 ease-out hover:bg-blue-chalk/8 hover:text-blue-chalk focus-visible:ring-2 focus-visible:ring-aquamarine/60 pointer-coarse:h-11 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:p-0 motion-reduce:transition-none"
// The current page is the one lit thing: a filled pill and an aquamarine icon.
const activeRowClasses =
  "border-biloba-flower/40 bg-daisy-bush/55 text-blue-chalk hover:bg-daisy-bush/55 [&_svg]:text-aquamarine"
export const labelClasses = "truncate text-left group-data-[collapsible=icon]:hidden"
export const tooltipClasses =
  "glass rounded-pill border border-biloba-flower/40 bg-haiti/90 px-3 py-1.5 font-sans text-sm text-blue-chalk shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] [&_.cn-tooltip-arrow]:hidden"

type MenuProps = {
  items: HrNavigationItem[]
  pathname: string
  source: string | null
  className?: string
}

/** One group's rows. The current page is the filled pill. */
export function HrSidebarMenu({ items, pathname, source, className }: MenuProps) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <SidebarMenu className={cn(menuClasses, className)}>
      {items.map((item) => {
        const active = item.active(pathname, source)
        const Icon = item.icon
        return (
          <SidebarMenuItem key={item.href} className={itemClasses}>
            <SidebarMenuButton
              isActive={active}
              tooltip={{
                children: item.tooltip ?? item.label,
                className: tooltipClasses,
                side: "right",
                sideOffset: 10,
              }}
              className={cn(rowClasses, active && activeRowClasses)}
              render={
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => {
                    if (isMobile) setOpenMobile(false)
                  }}
                />
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className={labelClasses}>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
