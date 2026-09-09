import type { Transition } from "motion/react"
import { SITE_NAV_ITEMS } from "@/lib/site-nav"

export type NavigationDirection = 1 | -1

/** Horizontal slide for page enter + nav direction. */
export const NAV_SLIDE_DISTANCE = 28

/**
 * Shared navigation timing — one tween for page slide and nav pill so they
 * stay in sync without spring overshoot (which reads as lag on large pages).
 */
export const navigationTransition: Transition = {
  type: "tween",
  duration: 0.22,
  ease: [0.32, 0.72, 0, 1],
}

export const navigationSnap: Transition = { duration: 0 }

/** Softer follow for the nav hover blob — trails the pointer between tabs. */
export const navHoverFollowTransition: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 26,
  mass: 0.45,
}

export function getSiteNavIndex(pathname: string) {
  return SITE_NAV_ITEMS.findIndex((item) => item.href === pathname)
}

export function resolveNavigationDirection(
  previousPath: string,
  nextPath: string,
  historyStack: readonly string[]
): NavigationDirection {
  const previousIndex = getSiteNavIndex(previousPath)
  const nextIndex = getSiteNavIndex(nextPath)

  if (previousIndex !== -1 && nextIndex !== -1 && previousIndex !== nextIndex) {
    return nextIndex > previousIndex ? 1 : -1
  }

  const existingIndex = historyStack.indexOf(nextPath)
  if (existingIndex !== -1 && existingIndex < historyStack.length - 1) {
    return -1
  }

  return 1
}

export function getNavigationTransition(reducedMotion: boolean) {
  return reducedMotion ? navigationSnap : navigationTransition
}

export function pageEnterOffset(
  direction: NavigationDirection,
  reducedMotion: boolean
) {
  if (reducedMotion) return 0
  return direction * NAV_SLIDE_DISTANCE
}
