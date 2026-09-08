"use client"

import Link from "next/link"
import { LazyMotion, domAnimation, m } from "motion/react"
import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react"

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

const linksRowClasses =
  "relative hidden items-center gap-1 rounded-pill font-mono text-sm md:flex"
const navLinkClasses = "relative z-10 rounded-pill px-3 py-1.5 transition-colors"
const inactiveNavLinkClasses = "text-prelude hover:text-blue-chalk"
const activeNavLinkClasses = "bg-aquamarine text-haiti hover:text-haiti"
const hoverPillClasses =
  "pointer-events-none absolute top-0 left-0 z-0 rounded-pill bg-aquamarine/20"

const layoutSpring = { type: "spring" as const, stiffness: 400, damping: 35 }
const snapTransition = { duration: 0 }

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

export function DesktopNavLinks({ items, pathname }: DesktopNavLinksProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)
  const [hoverRect, setHoverRect] = useState<PillRect | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  const setLinkRef = useCallback(
    (href: string) => (node: HTMLAnchorElement | null) => {
      if (node) linkRefs.current.set(href, node)
      else linkRefs.current.delete(href)
    },
    []
  )

  const measureHover = useCallback((href: string | null) => {
    if (!href || href === pathname) {
      setHoverRect(null)
      return
    }
    setHoverRect(
      measureLink(linkRefs.current.get(href) ?? null, rowRef.current)
    )
  }, [pathname])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches)

    updateReducedMotion()
    mediaQuery.addEventListener("change", updateReducedMotion)
    return () => mediaQuery.removeEventListener("change", updateReducedMotion)
  }, [])

  const remeasureHover = useEffectEvent(() => {
    if (hoveredHref) measureHover(hoveredHref)
  })

  useEffect(() => {
    window.addEventListener("resize", remeasureHover)
    return () => window.removeEventListener("resize", remeasureHover)
  }, [])

  const transition = reducedMotion ? snapTransition : layoutSpring
  const showHoverPill =
    hoverRect !== null && hoveredHref !== null && hoveredHref !== pathname

  return (
    <LazyMotion features={domAnimation}>
      <div
        ref={rowRef}
        className={linksRowClasses}
        onPointerLeave={() => {
          setHoveredHref(null)
          setHoverRect(null)
        }}
      >
        {showHoverPill && hoverRect ? (
          <m.span
            className={hoverPillClasses}
            initial={false}
            style={{ width: hoverRect.width, height: hoverRect.height }}
            animate={{
              x: hoverRect.left,
              y: hoverRect.top,
              opacity: 1,
            }}
            exit={{ opacity: 0 }}
            transition={transition}
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
                isActive
                  ? activeNavLinkClasses
                  : inactiveNavLinkClasses,
                !isActive && isHovered && "text-blue-chalk"
              )}
              onPointerEnter={() => {
                setHoveredHref(item.href)
                measureHover(item.href)
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </LazyMotion>
  )
}
