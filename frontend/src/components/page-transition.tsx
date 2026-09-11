"use client"

import { usePathname } from "next/navigation"
import { m } from "motion/react"
import type { ReactNode } from "react"
import { useNavigationMotion } from "@/components/navigation-motion-provider"
import { pageEnterOffset } from "@/lib/navigation-motion"

const shellClasses = "overflow-x-clip"
const pageClasses = "w-full transform-gpu"
const hrPageClasses = "h-svh w-full overflow-hidden"

type PageTransitionProps = {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const isHrDashboard = pathname.startsWith("/admin/hr")
  const { direction, transition, animatePage, clearPageAnimation } =
    useNavigationMotion()

  if (!animatePage) {
    return (
      <div className={isHrDashboard ? hrPageClasses : pageClasses}>
        {children}
      </div>
    )
  }

  return (
    <div className={shellClasses}>
      <m.div
        key={pathname}
        initial={{ x: pageEnterOffset(direction, false) }}
        animate={{ x: 0 }}
        transition={transition}
        className={pageClasses}
        onAnimationComplete={clearPageAnimation}
      >
        {children}
      </m.div>
    </div>
  )
}
