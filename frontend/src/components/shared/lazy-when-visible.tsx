"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { REVEAL_SECTION_EVENT } from "@/lib/site/reveal-section-event"
import { cn } from "@/lib/utils"

const placeholderClasses =
  "w-full rounded-[14px] bg-daisy-bush/15 motion-reduce:animate-none [content-visibility:auto]"

type LazyWhenVisibleProps = {
  children: ReactNode
  /** Reserved height before the section mounts (reduces layout shift). */
  minHeight?: string
  /** IntersectionObserver rootMargin — load slightly before entering the viewport. */
  rootMargin?: string
  className?: string
  /** Section id for in-page nav; placeholder carries this id until content mounts. */
  anchorId?: string
}

function hashTargetsSection(anchorId: string) {
  return window.location.hash === `#${anchorId}`
}

export function LazyWhenVisible({
  children,
  minHeight = "12rem",
  rootMargin = "120px 0px",
  className,
  anchorId,
}: LazyWhenVisibleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!anchorId) return

    function revealFromHash() {
      if (anchorId && hashTargetsSection(anchorId)) setVisible(true)
    }

    function onReveal(event: Event) {
      const sectionId = (event as CustomEvent<{ sectionId: string }>).detail
        ?.sectionId
      if (sectionId === anchorId) setVisible(true)
    }

    revealFromHash()
    window.addEventListener("hashchange", revealFromHash)
    window.addEventListener(REVEAL_SECTION_EVENT, onReveal)
    return () => {
      window.removeEventListener("hashchange", revealFromHash)
      window.removeEventListener(REVEAL_SECTION_EVENT, onReveal)
    }
  }, [anchorId])

  useEffect(() => {
    const node = ref.current
    if (!node || visible) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [visible, rootMargin])

  return (
    <div ref={ref} className={className}>
      {visible ? (
        children
      ) : (
        <div
          id={anchorId}
          className={cn(placeholderClasses, "animate-pulse scroll-mt-20")}
          style={{ minHeight }}
          aria-hidden
        />
      )}
    </div>
  )
}
