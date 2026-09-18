"use client"

import { useLayoutEffect } from "react"
import { usePathname } from "next/navigation"

export function ScrollToTop() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual"
    }
  }, [])

  useLayoutEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash && document.getElementById(hash)) {
      document.getElementById(hash)?.scrollIntoView({ behavior: "instant", block: "start" })
      return
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" })
  }, [pathname])

  return null
}
