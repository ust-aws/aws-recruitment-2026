"use client"

import { usePathname } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Transition } from "motion/react"
import {
  getNavigationTransition,
  isApplyFlowTabSwitch,
  isHrDashboardSwitch,
  resolveNavigationDirection,
  type NavigationDirection,
} from "@/lib/site/navigation-motion"

type NavigationMotionContextValue = {
  direction: NavigationDirection
  transition: Transition
  reducedMotion: boolean
  animatePage: boolean
  clearPageAnimation: () => void
}

const NavigationMotionContext =
  createContext<NavigationMotionContextValue | null>(null)

function usePrefersReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return reducedMotion
}

type NavigationState = {
  pathname: string
  historyStack: string[]
  direction: NavigationDirection
  animatePage: boolean
}

function navigationStateForPath(
  current: NavigationState,
  pathname: string,
  reducedMotion: boolean
): NavigationState {
  const direction = resolveNavigationDirection(
    current.pathname,
    pathname,
    current.historyStack
  )
  const existingIndex = current.historyStack.indexOf(pathname)
  const historyStack =
    existingIndex !== -1 && existingIndex < current.historyStack.length - 1
      ? current.historyStack.slice(0, existingIndex + 1)
      : current.historyStack[current.historyStack.length - 1] === pathname
        ? current.historyStack
        : [...current.historyStack, pathname]

  return {
    pathname,
    historyStack,
    direction,
    animatePage:
      !reducedMotion &&
      !isApplyFlowTabSwitch(current.pathname, pathname) &&
      !isHrDashboardSwitch(current.pathname, pathname),
  }
}

export function NavigationMotionProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const reducedMotion = usePrefersReducedMotion()
  const [navigation, setNavigation] = useState<NavigationState>({
    pathname,
    historyStack: [pathname],
    direction: 1,
    animatePage: false,
  })

  if (navigation.pathname !== pathname) {
    setNavigation((current) =>
      navigationStateForPath(current, pathname, reducedMotion)
    )
  }

  const clearPageAnimation = useCallback(() => {
    setNavigation((current) =>
      current.animatePage ? { ...current, animatePage: false } : current
    )
  }, [])

  const transition = getNavigationTransition(reducedMotion)
  const contextValue = useMemo<NavigationMotionContextValue>(
    () => ({
      direction: navigation.direction,
      transition,
      reducedMotion,
      animatePage: navigation.animatePage,
      clearPageAnimation,
    }),
    [clearPageAnimation, navigation, reducedMotion, transition]
  )

  return (
    <NavigationMotionContext.Provider value={contextValue}>
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
