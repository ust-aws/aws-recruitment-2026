"use client"

import { usePathname } from "next/navigation"
import { useReducedMotion } from "motion/react"
import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Transition } from "motion/react"
import {
  getNavigationTransition,
  resolveNavigationDirection,
  type NavigationDirection,
} from "@/lib/navigation-motion"

type NavigationMotionContextValue = {
  direction: NavigationDirection
  transition: Transition
  reducedMotion: boolean
  animatePage: boolean
  clearPageAnimation: () => void
}

const NavigationMotionContext =
  createContext<NavigationMotionContextValue | null>(null)

export function NavigationMotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reducedMotion = useReducedMotion() ?? false
  const historyStackRef = useRef<string[]>([pathname])
  const previousPathRef = useRef(pathname)
  const directionRef = useRef<NavigationDirection>(1)
  const animatePageRef = useRef(false)
  const [, setAnimationEpoch] = useState(0)

  if (previousPathRef.current !== pathname) {
    directionRef.current = resolveNavigationDirection(
      previousPathRef.current,
      pathname,
      historyStackRef.current
    )

    const existingIndex = historyStackRef.current.indexOf(pathname)
    if (
      existingIndex !== -1 &&
      existingIndex < historyStackRef.current.length - 1
    ) {
      historyStackRef.current = historyStackRef.current.slice(
        0,
        existingIndex + 1
      )
    } else if (
      historyStackRef.current[historyStackRef.current.length - 1] !== pathname
    ) {
      historyStackRef.current = [...historyStackRef.current, pathname]
    }

    animatePageRef.current = !reducedMotion
    previousPathRef.current = pathname
  }

  const clearPageAnimation = useCallback(() => {
    if (!animatePageRef.current) return
    animatePageRef.current = false
    setAnimationEpoch((epoch) => epoch + 1)
  }, [])

  const transition = getNavigationTransition(reducedMotion)

  return (
    <NavigationMotionContext.Provider
      value={{
        direction: directionRef.current,
        transition,
        reducedMotion,
        animatePage: animatePageRef.current,
        clearPageAnimation,
      }}
    >
      {children}
    </NavigationMotionContext.Provider>
  )
}

export function useNavigationMotion() {
  const context = useContext(NavigationMotionContext)
  if (!context) {
    throw new Error(
      "useNavigationMotion must be used within NavigationMotionProvider"
    )
  }
  return context
}
