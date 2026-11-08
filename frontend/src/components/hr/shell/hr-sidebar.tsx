"use client"

import Link from "next/link"
import { LayoutDashboard, LogOut } from "lucide-react"

import { logoutHrSession } from "@/app/(site)/login/actions"
import {
  hrWorkspaceTitle,
  type HrRole,
} from "@/components/hr/shell/hr-navigation"
import { HrSidebarNavigation } from "@/components/hr/shell/hr-sidebar-navigation"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const sidebarHeaderClasses =
  "flex flex-row items-center gap-2 border-b border-blue-chalk/20 bg-meteorite/40 p-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
const brandRowClasses =
  "flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-aquamarine/60 group-data-[collapsible=icon]:hidden"
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
  "min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-haiti/50 px-3 py-4 [scrollbar-color:rgb(198_184_232/0.3)_transparent] [scrollbar-width:thin] group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0"
const sidebarFooterClasses =
  "border-t border-blue-chalk/20 bg-meteorite/40 p-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:p-2 group-data-[collapsible=icon]:px-0"
const logoutButtonClasses =
  "h-10 w-full justify-start gap-2 px-4 text-xs group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
const logoutLabelClasses = "group-data-[collapsible=icon]:sr-only"

function onLogout() {
  void logoutHrSession()
}

export function HrSidebar({
  role,
}: {
  role: HrRole
}) {
  const { isMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className={sidebarHeaderClasses}>
        <Link
          href="/admin/hr/overview"
          className={brandRowClasses}
        >
          <span className={brandMarkClasses} aria-hidden>
            <LayoutDashboard className="size-4" />
          </span>
          <span className={brandCopyClasses}>
            <span className={brandEyebrowClasses}>AWS Builders – UST</span>
            <span className={brandTitleClasses}>{hrWorkspaceTitle(role)}</span>
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
        <HrSidebarNavigation role={role} />
      </SidebarContent>
      <SidebarFooter className={sidebarFooterClasses}>
        <Button
          type="button"
          color="purple"
          className={logoutButtonClasses}
          onClick={onLogout}
        >
          <LogOut className="size-4 shrink-0" />
          <span className={logoutLabelClasses}>Logout</span>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
