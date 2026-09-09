"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const shellClasses = "mx-auto w-full max-w-[1180px] px-4 pt-8 md:px-10"
const tabListClasses = "flex flex-wrap gap-2"
const tabClasses =
  "rounded-pill px-3 py-1.5 font-mono text-xs transition-colors"
const activeTabClasses = "bg-aquamarine text-haiti"
const inactiveTabClasses =
  "text-prelude hover:bg-biloba-flower/15 hover:text-blue-chalk"

const APPLY_FLOW_TABS = [
  { label: "Positions", href: "/apply/positions" },
  { label: "Apply", href: "/apply/form" },
  { label: "Already applied?", href: "/apply/status" },
]

export function ApplyFlowTabs() {
  const pathname = usePathname()

  if (pathname.startsWith("/apply/dashboard")) {
    return null
  }

  return (
    <div className={shellClasses}>
      <nav aria-label="Apply flow" className={tabListClasses}>
        {APPLY_FLOW_TABS.map((tab) => {
          const isActive =
            tab.href === "/apply/positions"
              ? pathname === "/apply" || pathname.startsWith("/apply/positions")
              : tab.href === "/apply/status"
                ? pathname.startsWith("/apply/status")
                : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                tabClasses,
                isActive ? activeTabClasses : inactiveTabClasses
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
