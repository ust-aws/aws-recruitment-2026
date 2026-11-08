"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { dashboardPanelClasses } from "@/lib/site/dashboard-surface"
import { cn } from "@/lib/utils"

// Wide screens: the panel docks beside the table and stays in view while the
// list scrolls. Narrower: the same panel slides in as a sheet.
const WIDE_QUERY = "(min-width: 1280px)"
const asideClasses = cn(
  dashboardPanelClasses,
  "sticky top-6 flex max-h-[calc(100svh-3rem)] min-h-0 flex-col overflow-hidden",
)
// Solid like the docked panel; the panel brings its own close button.
const sheetClasses = "w-full bg-haiti sm:w-[28rem]"

function subscribe(onChange: () => void) {
  const media = window.matchMedia(WIDE_QUERY)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

export function useWideScreen() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIDE_QUERY).matches,
    () => true,
  )
}

type PaymentsReviewDockProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

export function PaymentsReviewDock({ open, title, onClose, children }: PaymentsReviewDockProps) {
  const wide = useWideScreen()
  if (wide) {
    return open ? (
      <aside className={asideClasses} aria-label={`Review: ${title}`}>
        {children}
      </aside>
    ) : null
  }
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent side="right" showCloseButton={false} className={sheetClasses}>
        <SheetTitle className="sr-only">Review: {title}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  )
}
