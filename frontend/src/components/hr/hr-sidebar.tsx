"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CalendarRange,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Send,
} from "lucide-react"

import { logoutHrSession } from "@/app/(site)/login/actions"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const sidebarHeaderClasses =
  "flex flex-row items-center gap-2 border-b border-blue-chalk/20 bg-meteorite/40 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
const brandRowClasses =
  "flex min-w-0 flex-1 items-center gap-3 group-data-[collapsible=icon]:hidden"
const brandMarkClasses =
  "grid size-9 shrink-0 place-items-center rounded-full border border-aquamarine/35 bg-aquamarine/15 text-aquamarine"
const brandCopyClasses = "flex min-w-0 flex-col leading-tight"
const brandEyebrowClasses =
  "font-mono text-[10px] uppercase tracking-[0.18em] text-aquamarine"
const brandTitleClasses =
  "truncate font-sans text-sm font-semibold text-blue-chalk"
const triggerClasses =
  "size-9 shrink-0 rounded-full border border-blue-chalk/20 bg-haiti/40 text-blue-chalk hover:border-aquamarine/40 hover:bg-aquamarine/15 hover:text-aquamarine"
const sidebarBodyClasses =
  "flex-1 overflow-visible bg-haiti/50 px-3 py-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:overflow-visible group-data-[collapsible=icon]:px-0"
const sidebarMenuClasses =
  "w-full gap-1.5 group-data-[collapsible=icon]:items-center"
const sidebarFooterClasses =
  "border-t border-blue-chalk/20 bg-meteorite/40 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:px-0"
const navButtonIdleClasses =
  "h-10 w-full justify-start gap-3 rounded-pill border border-transparent px-3 text-left text-sm font-medium text-prelude transition-[background-color,border-color,color,transform,box-shadow] duration-300 ease-out hover:-translate-y-px hover:border-biloba-flower/35 hover:bg-meteorite/55 hover:text-blue-chalk hover:shadow-[0_0_18px_rgba(183,140,240,0.22)] hover:[&_svg]:text-aquamarine group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:rounded-full motion-reduce:transition-none motion-reduce:hover:translate-y-0"
const navButtonActiveClasses =
  "border-biloba-flower/40 bg-daisy-bush/55 text-blue-chalk shadow-[0_0_16px_rgba(183,140,240,0.18)] [&_svg]:text-aquamarine group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:justify-center"
const navLabelClasses =
  "truncate text-left group-data-[collapsible=icon]:hidden"
const navTooltipClasses =
  "glass rounded-pill border border-biloba-flower/40 bg-haiti/90 px-3 py-1.5 font-sans text-sm text-blue-chalk shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] [&_.cn-tooltip-arrow]:hidden"
const logoutButtonClasses =
  "h-10 w-full justify-start gap-2 px-4 text-xs group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
const logoutLabelClasses = "group-data-[collapsible=icon]:sr-only"

function isApplicationsActive(pathname: string) {
  if (pathname === "/admin/hr") return true
  const match = /^\/admin\/hr\/([^/]+)$/.exec(pathname)
  if (!match) return false
  return match[1] !== "season" && match[1] !== "results"
}

const navItems = [
  {
    label: "Applications",
    href: "/admin/hr",
    icon: ClipboardList,
    isActive: isApplicationsActive,
  },
  {
    label: "Results",
    href: "/admin/hr/results",
    icon: Send,
    isActive: (pathname: string) => pathname.startsWith("/admin/hr/results"),
  },
  {
    label: "R101",
    href: "/admin/hr/season",
    icon: CalendarRange,
    isActive: (pathname: string) => pathname.startsWith("/admin/hr/season"),
  },
] as const

export function HrSidebar() {
  const pathname = usePathname()
  const { isMobile } = useSidebar()

  function onLogout() {
    void logoutHrSession()
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className={sidebarHeaderClasses}>
        <Link href="/admin/hr" className={brandRowClasses}>
          <span className={brandMarkClasses} aria-hidden>
            <LayoutDashboard className="size-4" />
          </span>
          <span className={brandCopyClasses}>
            <span className={brandEyebrowClasses}>Admin</span>
            <span className={brandTitleClasses}>HR Dashboard</span>
          </span>
        </Link>
        {isMobile ? null : (
          <SidebarTrigger
            className={triggerClasses}
            aria-label="Toggle sidebar"
          />
        )}
      </SidebarHeader>
      <SidebarContent className={sidebarBodyClasses}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className={sidebarMenuClasses}>
              {navItems.map((item) => {
                const active = item.isActive(pathname)
                const Icon = item.icon
                return (
                  <SidebarMenuItem
                    key={item.href}
                    className="w-full group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                  >
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={{
                        children: item.label,
                        className: navTooltipClasses,
                        side: "right",
                        sideOffset: 10,
                      }}
                      className={cn(
                        navButtonIdleClasses,
                        active && navButtonActiveClasses
                      )}
                      render={
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                        />
                      }
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className={navLabelClasses}>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className={sidebarFooterClasses}>
        <Button
          type="button"
          color="purple"
          className={logoutButtonClasses}
          onClick={() => void onLogout()}
        >
          <LogOut className="size-4 shrink-0" />
          <span className={logoutLabelClasses}>Logout</span>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
