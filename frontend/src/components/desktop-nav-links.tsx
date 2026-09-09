"use client"

import Link from "next/link"
import { m } from "motion/react"
import type { Transition } from "motion/react"
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import { useNavigationMotion } from "@/components/navigation-motion-provider"
import {
  navHoverFollowTransition,
  navigationSnap,
} from "@/lib/navigation-motion"
import { cn } from "@/lib/utils"

export type DesktopNavItem = {
  label: string
  href: string
}

type PillRect = {
  left: number
  top: number
  width: number
  height: number
}

type TabSegment = {
  href: string
  rect: PillRect
}

const linksRowClasses =
  "relative hidden items-center gap-1 rounded-pill font-mono text-sm md:flex"
const navLinkClasses = "relative z-10 rounded-pill px-3 py-1.5 transition-colors"
const inactiveNavLinkClasses = "text-prelude hover:text-blue-chalk"
const activeNavLinkClasses = "text-haiti hover:text-haiti"
const pillBaseClasses =
  "pointer-events-none absolute top-0 left-0 z-0 transform-gpu rounded-pill"
const activePillClasses = `${pillBaseClasses} bg-aquamarine`
const hoverPillClasses = `${pillBaseClasses} z-[1] bg-aquamarine/20`

type DesktopNavLinksProps = {
  items: readonly DesktopNavItem[]
  pathname: string
}

function measureLink(
  link: HTMLElement | null,
  row: HTMLElement | null
): PillRect | null {
  if (!link || !row) return null
  return {
    left: link.offsetLeft,
    top: link.offsetTop,
    width: link.offsetWidth,
    height: link.offsetHeight,
  }
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function getTabSegments(
  items: readonly DesktopNavItem[],
  linkRefs: Map<string, HTMLAnchorElement>,
  row: HTMLElement
): TabSegment[] {
  return items.flatMap((item) => {
    const rect = measureLink(linkRefs.get(item.href) ?? null, row)
    return rect ? [{ href: item.href, rect }] : []
  })
}

function resolveHoverFromPointer(
  segments: TabSegment[],
  row: HTMLElement,
  clientX: number
): { rect: PillRect; href: string } | null {
  if (segments.length === 0) return null

  const x = clientX - row.getBoundingClientRect().left
  const first = segments[0]
  const last = segments[segments.length - 1]

  if (x <= first.rect.left) {
    return { rect: first.rect, href: first.href }
  }

  const lastRight = last.rect.left + last.rect.width
  if (x >= lastRight) {
    return { rect: last.rect, href: last.href }
  }

  for (let index = 0; index < segments.length; index++) {
    const current = segments[index]
    const { rect } = current

    if (x >= rect.left && x <= rect.left + rect.width) {
      return { rect, href: current.href }
    }

    const next = segments[index + 1]
    if (!next) continue

    const gapStart = rect.left + rect.width
    const gapEnd = next.rect.left
    if (x <= gapStart || x >= gapEnd) continue

    const span = gapEnd - gapStart
    const amount = span === 0 ? 0 : (x - gapStart) / span

    return {
      rect: {
        left: lerp(rect.left, next.rect.left, amount),
        top: lerp(rect.top, next.rect.top, amount),
        width: lerp(rect.width, next.rect.width, amount),
        height: lerp(rect.height, next.rect.height, amount),
      },
      href: amount < 0.5 ? current.href : next.href,
    }
  }

  let nearest = first
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const segment of segments) {
    const center = segment.rect.left + segment.rect.width / 2
    const distance = Math.abs(x - center)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = segment
    }
  }

  return { rect: nearest.rect, href: nearest.href }
}

export function DesktopNavLinks({ items, pathname }: DesktopNavLinksProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const lastPointerXRef = useRef<number | null>(null)
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)
  const [hoverRect, setHoverRect] = useState<PillRect | null>(null)
  const [activeRect, setActiveRect] = useState<PillRect | null>(null)
  const [pointerOverRow, setPointerOverRow] = useState(false)
  const { transition, reducedMotion } = useNavigationMotion()

  const hoverTransition: Transition = reducedMotion
    ? navigationSnap
    : navHoverFollowTransition

  const setLinkRef = useCallback(
    (href: string) => (node: HTMLAnchorElement | null) => {
      if (node) linkRefs.current.set(href, node)
      else linkRefs.current.delete(href)
    },
    []
  )

  const measureActive = useCallback(() => {
    const activeItem = items.find((item) => item.href === pathname)
    if (!activeItem) {
      setActiveRect(null)
      return
    }
    setActiveRect(
      measureLink(linkRefs.current.get(activeItem.href) ?? null, rowRef.current)
    )
  }, [items, pathname])

  const updateHoverFromPointer = useCallback(
    (clientX: number) => {
      const row = rowRef.current
      if (!row) return

      const resolved = resolveHoverFromPointer(
        getTabSegments(items, linkRefs.current, row),
        row,
        clientX
      )
      if (!resolved) return

      setHoverRect(resolved.rect)
      setHoveredHref(resolved.href)
    },
    [items]
  )

  useLayoutEffect(() => {
    measureActive()
  }, [measureActive])

  const remeasurePills = useEffectEvent(() => {
    measureActive()
    if (lastPointerXRef.current !== null) {
      updateHoverFromPointer(lastPointerXRef.current)
    }
  })

  useEffect(() => {
    window.addEventListener("resize", remeasurePills)
    return () => window.removeEventListener("resize", remeasurePills)
  }, [])

  const showHoverPill = pointerOverRow && hoverRect !== null

  return (
    <div
      ref={rowRef}
      className={linksRowClasses}
      onPointerEnter={(event) => {
        setPointerOverRow(true)
        lastPointerXRef.current = event.clientX
        updateHoverFromPointer(event.clientX)
      }}
      onPointerMove={(event) => {
        lastPointerXRef.current = event.clientX
        updateHoverFromPointer(event.clientX)
      }}
      onPointerLeave={() => {
        setPointerOverRow(false)
        lastPointerXRef.current = null
        setHoveredHref(null)
        setHoverRect(null)
      }}
    >
      {activeRect ? (
        <m.span
          className={activePillClasses}
          initial={false}
          animate={{
            x: activeRect.left,
            y: activeRect.top,
          }}
          style={{
            width: activeRect.width,
            height: activeRect.height,
          }}
          transition={reducedMotion ? navigationSnap : transition}
          aria-hidden="true"
        />
      ) : null}

      {showHoverPill && hoverRect ? (
        <m.span
          className={hoverPillClasses}
          initial={false}
          animate={{
            x: hoverRect.left,
            y: hoverRect.top,
          }}
          style={{
            width: hoverRect.width,
            height: hoverRect.height,
          }}
          transition={hoverTransition}
          aria-hidden="true"
        />
      ) : null}

      {items.map((item) => {
        const isActive = pathname === item.href
        const isHovered = hoveredHref === item.href

        return (
          <Link
            key={item.href}
            ref={setLinkRef(item.href)}
            href={item.href}
            className={cn(
              navLinkClasses,
              isActive ? activeNavLinkClasses : inactiveNavLinkClasses,
              !isActive && isHovered && "text-blue-chalk"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </div>
  )
}
