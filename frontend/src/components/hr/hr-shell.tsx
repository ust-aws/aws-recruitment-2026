"use client"

import type { ReactNode } from "react"
import { HrSidebar } from "@/components/hr/hr-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const providerClasses = "h-svh max-h-svh overflow-hidden"
const mobileTriggerClasses =
  "absolute left-3 top-3 z-20 size-11 text-blue-chalk md:hidden"
const insetClasses =
  "relative min-h-0 min-w-0 flex-1 overflow-x-clip overflow-y-auto bg-jacarta pt-12 md:pt-0"

export function HrShell({
  children,
  role,
}: {
  children: ReactNode
  role: "hr" | "admin"
}) {
  return (
    <TooltipProvider>
      <SidebarProvider className={providerClasses}>
        <HrSidebar role={role} />
        <SidebarInset className={insetClasses}>
          <SidebarTrigger
            className={mobileTriggerClasses}
            aria-label="Open dashboard navigation"
          />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
