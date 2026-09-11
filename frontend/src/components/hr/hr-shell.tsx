"use client"

import type { ReactNode } from "react"
import { HrSidebar } from "@/components/hr/hr-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

const mobileTriggerClasses =
  "absolute left-3 top-3 z-20 text-blue-chalk md:hidden"
const providerClasses = "h-svh max-h-svh overflow-hidden"
const insetClasses =
  "relative min-h-0 flex-1 overflow-y-auto bg-jacarta pt-12 md:pt-0"

export function HrShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider className={providerClasses}>
        <HrSidebar />
        <SidebarInset className={insetClasses}>
          <SidebarTrigger
            className={mobileTriggerClasses}
            aria-label="Open sidebar"
          />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
