"use client"

import { usePathname } from "next/navigation"
import { SiteFooter } from "@/components/site/site-footer"

function shouldHideFooter(pathname: string) {
  return pathname.startsWith("/apply") || pathname.startsWith("/admin/hr")
}

export function SiteFooterGate() {
  const pathname = usePathname()

  if (shouldHideFooter(pathname)) {
    return null
  }

  return <SiteFooter />
}
