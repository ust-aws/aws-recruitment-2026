"use client"

import Link from "next/link"
import { LazyMotion, domAnimation, m } from "motion/react"
import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export type DesktopNavItem = {
  label: string
  href: string
}

type PillRect = {
  left: number
  width: number
}

const linksRowClasses =
  "relative hidden items-center gap-1 rounded-pill font-mono text-sm md:flex"
const navLinkClasses =
  "relative z-10 rounded-pill px-3 py-1.5 transition-colors"
const activeTextClasses = "text-haiti"
const inactiveTextClasses = "text-prelude"
const hoveredTextClasses = "text-blue-chalk"
const pillBaseClasses =
  "pointer-events-none absolute top-0 bottom-0 z-0 rounded-pill"
const activePillClasses = `${pillBaseClasses} bg-aquamarine`
const hoverPillClasses = `${pillBaseClasses} glass border border-aquamarine/35 bg-aquamarine/22`

const layoutSpring = { type: "spring" as const, stiffness: 400, damping: 35 }
const snapTransition = { duration: 0 }

type DesktopNavLinksProps = {
  items: DesktopNavItem[]
  pathname: string
}

function measureLink(
  link: HTMLElement | null,
  row: HTMLElement | null
): PillRect | null {
  if (!link || !row) return null
  return { left: link.offsetLeft, width: link.offsetWidth }
}

export function DesktopNavLinks({ items, pathname }: DesktopNavLinksProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map())
  const [hoveredHref, setHoveredHref] = useState<string | null>(null)
  const [activeRect, setActiveRect] = useState<PillRect | null>(null)
  const [hoverRect, setHoverRect] = useState<PillRect | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  const setLinkRef = useCallback(
    (href: string) => (node: HTMLAnchorElement | null) => {
      if (node) linkRefs.current.set(href, node)
      else linkRefs.current.delete(href)
    },
    []
  )

  const measureActive = useCallback(() => {
    setActiveRect(
      measureLink(linkRefs.current.get(pathname) ?? null, rowRef.current)
    )
  }, [pathname])

  const measureHover = useCallback((href: string | null) => {
    if (!href) {
      setHoverRect(null)
      return
    }
    setHoverRect(
      measureLink(linkRefs.current.get(href) ?? null, rowRef.current)
    )
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const updateReducedMotion = () => setReducedMotion(mediaQuery.matches)

    updateReducedMotion()
    mediaQuery.addEventListener("change", updateReducedMotion)
    return () => mediaQuery.removeEventListener("change", updateReducedMotion)
  }, [])

  useEffect(() => {
    measureActive()

    const frame = window.requestAnimationFrame(measureActive)
    window.addEventListener("resize", measureActive)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", measureActive)
    }
  }, [measureActive])

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
      {activeRect ? (
        <m.span
          className={activePillClasses}
          style={{ width: 1, transformOrigin: "left center" }}
          initial={false}
          animate={{ x: activeRect.left, scaleX: activeRect.width }}
          transition={transition}
          aria-hidden="true"
        />
      ) : null}

      {showHoverPill && hoverRect ? (
        <m.span
          className={hoverPillClasses}
          style={{ width: 1, transformOrigin: "left center" }}
          initial={false}
          animate={{ x: hoverRect.left, scaleX: hoverRect.width }}
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
                ? activeTextClasses
                : isHovered
                  ? hoveredTextClasses
                  : inactiveTextClasses
            )}
            onPointerEnter={() => {
              setHoveredHref(item.href)
              if (item.href !== pathname) measureHover(item.href)
              else setHoverRect(null)
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
