"use client"

import { LazyMotion, MotionConfig, domAnimation } from "motion/react"
import type { ReactNode } from "react"

type MotionShellProps = {
  children: ReactNode
}

export function MotionShell({ children }: MotionShellProps) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
